"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useActiveWallet } from "@/hooks/use-active-wallet";
import {
  buildContractPreview,
  buildInstructionBadge,
  decodeContractConsoleError,
  executeContractInstruction,
  exportSavedContractCall,
  getContractProgramCatalog,
  getDefaultInstructionForProgram,
  getDefaultSavedContractCalls,
  getIdlInspectorData,
  getInitialArgValues,
  getInstructionSummaries,
  getPinnedInstructionKeys,
  readProgramAccountState,
  resolveInstructionAccounts,
  simulateContractInstruction,
  type ContractConsoleMode,
  type ContractConsoleProgramKey,
  type ContractExecutionResult,
  type ContractInstructionHistoryEntry,
  type ContractSavedCall,
  type ContractSimulationResult,
} from "@/services/contractConsoleService";

const SAVED_CALLS_KEY = "retix-contract-console-saved-calls";
const HISTORY_KEY = "retix-contract-console-history";
const PINNED_KEY = "retix-contract-console-pins";

function readStorage<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useContractConsole() {
  const wallet = useActiveWallet();
  const skipNextResetCountRef = useRef(0);
  const programs = useMemo(() => getContractProgramCatalog(), []);
  const [selectedProgramKey, setSelectedProgramKey] = useState<ContractConsoleProgramKey>("staking");
  const [selectedInstructionName, setSelectedInstructionName] = useState(
    getDefaultInstructionForProgram("staking"),
  );
  const [mode, setMode] = useState<ContractConsoleMode>("friendly");
  const [argValues, setArgValues] = useState<Record<string, string>>(() =>
    getInitialArgValues("staking", getDefaultInstructionForProgram("staking")),
  );
  const [accountOverrides, setAccountOverrides] = useState<Record<string, string>>({});
  const [stateReaderAccountType, setStateReaderAccountType] = useState("");
  const [stateReaderAddress, setStateReaderAddress] = useState("");
  const [savedCalls, setSavedCalls] = useState<ContractSavedCall[]>([]);
  const [instructionHistory, setInstructionHistory] = useState<ContractInstructionHistoryEntry[]>([]);
  const [pinnedInstructionKeys, setPinnedInstructionKeys] = useState<string[]>([]);
  const [lastSimulation, setLastSimulation] = useState<ContractSimulationResult | null>(null);
  const [lastExecution, setLastExecution] = useState<ContractExecutionResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    setSavedCalls(readStorage(SAVED_CALLS_KEY, getDefaultSavedContractCalls()));
    setInstructionHistory(readStorage(HISTORY_KEY, []));
    setPinnedInstructionKeys(readStorage(PINNED_KEY, getPinnedInstructionKeys("staking")));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SAVED_CALLS_KEY, JSON.stringify(savedCalls));
    }
  }, [savedCalls]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(instructionHistory.slice(0, 20)));
    }
  }, [instructionHistory]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedInstructionKeys));
    }
  }, [pinnedInstructionKeys]);

  const instructions = useMemo(() => getInstructionSummaries(selectedProgramKey), [selectedProgramKey]);
  const selectedProgram = useMemo(
    () => programs.find((program) => program.key === selectedProgramKey) || programs[0],
    [programs, selectedProgramKey],
  );

  const selectedInstruction =
    instructions.find((instruction) => instruction.name === selectedInstructionName) || instructions[0] || null;

  const idlInspector = useMemo(() => getIdlInspectorData(selectedProgramKey), [selectedProgramKey]);

  useEffect(() => {
    if (skipNextResetCountRef.current > 0) {
      skipNextResetCountRef.current -= 1;
      return;
    }
    const nextInstruction = getDefaultInstructionForProgram(selectedProgramKey);
    setSelectedInstructionName(nextInstruction);
    setArgValues(getInitialArgValues(selectedProgramKey, nextInstruction));
    setAccountOverrides({});
    setLastSimulation(null);
    setLastExecution(null);
    setLastError(null);
  }, [selectedProgramKey]);

  useEffect(() => {
    if (skipNextResetCountRef.current > 0) {
      skipNextResetCountRef.current -= 1;
      return;
    }
    if (!selectedInstruction) {
      return;
    }

    setArgValues(getInitialArgValues(selectedProgramKey, selectedInstruction.name));
    setAccountOverrides({});
    setLastSimulation(null);
    setLastError(null);
  }, [selectedInstructionName, selectedInstruction, selectedProgramKey]);

  useEffect(() => {
    if (selectedProgram?.accountTypes?.length) {
      setStateReaderAccountType((current) => current || selectedProgram.accountTypes[0]);
    }
  }, [selectedProgram]);

  const resolvedAccountsQuery = useQuery({
    queryKey: [
      "contract-console",
      "accounts",
      selectedProgramKey,
      selectedInstructionName,
      mode,
      wallet.address,
      argValues,
      accountOverrides,
    ],
    queryFn: () =>
      resolveInstructionAccounts({
        programKey: selectedProgramKey,
        instructionName: selectedInstructionName,
        argValues,
        accountOverrides,
        mode,
        context: wallet.publicKey
          ? {
              connection: wallet.connection,
              publicKey: wallet.publicKey,
              anchorWallet: wallet.anchorWallet,
              address: wallet.address,
              providerName: wallet.providerName,
            }
          : undefined,
      }),
    enabled: Boolean(selectedInstruction),
    staleTime: 1000 * 10,
  });

  const previewQuery = useQuery({
    queryKey: [
      "contract-console",
      "preview",
      selectedProgramKey,
      selectedInstructionName,
      argValues,
      resolvedAccountsQuery.data,
      wallet.address,
    ],
    queryFn: () =>
      buildContractPreview({
        programKey: selectedProgramKey,
        instructionName: selectedInstructionName,
        argValues,
        resolvedAccounts: resolvedAccountsQuery.data || [],
        context: wallet.publicKey
          ? {
              connection: wallet.connection,
              publicKey: wallet.publicKey,
              anchorWallet: wallet.anchorWallet,
              address: wallet.address,
              providerName: wallet.providerName,
            }
          : undefined,
      }),
    enabled: Boolean(selectedInstruction && resolvedAccountsQuery.data),
    staleTime: 1000 * 5,
  });

  const stateReaderQuery = useQuery({
    queryKey: ["contract-console", "state", selectedProgramKey, stateReaderAccountType, stateReaderAddress],
    queryFn: () =>
      readProgramAccountState({
        programKey: selectedProgramKey,
        accountType: stateReaderAccountType,
        address: stateReaderAddress.trim(),
      }),
    enabled: Boolean(stateReaderAccountType && stateReaderAddress.trim()),
    retry: false,
  });

  const simulateMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey || !wallet.anchorWallet) {
        throw new Error("Connect a wallet before simulating instructions.");
      }

      return simulateContractInstruction({
        programKey: selectedProgramKey,
        instructionName: selectedInstructionName,
        argValues,
        resolvedAccounts: resolvedAccountsQuery.data || [],
        context: {
          connection: wallet.connection,
          publicKey: wallet.publicKey,
          anchorWallet: wallet.anchorWallet,
          address: wallet.address,
          providerName: wallet.providerName,
        },
      });
    },
    onSuccess: (result) => {
      setLastSimulation(result);
      setLastError(result.error || null);
      if (result.success) {
        toast.success("Instruction simulated successfully.");
      } else {
        toast.error(result.error || "Simulation failed.");
      }
    },
    onError: (error) => {
      const message = decodeContractConsoleError(error);
      setLastError(message);
      toast.error(message);
    },
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey || !wallet.anchorWallet) {
        throw new Error("Connect a wallet before executing instructions.");
      }

      return executeContractInstruction({
        programKey: selectedProgramKey,
        instructionName: selectedInstructionName,
        argValues,
        resolvedAccounts: resolvedAccountsQuery.data || [],
        context: {
          connection: wallet.connection,
          publicKey: wallet.publicKey,
          anchorWallet: wallet.anchorWallet,
          address: wallet.address,
          providerName: wallet.providerName,
        },
      });
    },
    onSuccess: (result) => {
      setLastExecution(result);
      setLastError(null);
      setInstructionHistory((current) => [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          walletAddress: wallet.address,
          programKey: selectedProgramKey,
          instructionName: selectedInstructionName,
          status: "confirmed",
          signature: result.signature,
          argValues,
          accountOverrides,
        },
        ...current,
      ]);
      toast.success("On-chain execution confirmed.");
    },
    onError: (error) => {
      const message = decodeContractConsoleError(error);
      setLastError(message);
      setInstructionHistory((current) => [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          walletAddress: wallet.address,
          programKey: selectedProgramKey,
          instructionName: selectedInstructionName,
          status: "failed",
          error: message,
          argValues,
          accountOverrides,
        },
        ...current,
      ]);
      toast.error(message);
    },
  });

  function updateArgValue(name: string, value: string) {
    setArgValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateAccountOverride(name: string, value: string) {
    setAccountOverrides((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetCurrentInstruction() {
    if (!selectedInstruction) {
      return;
    }

    setArgValues(getInitialArgValues(selectedProgramKey, selectedInstruction.name));
    setAccountOverrides({});
    setLastSimulation(null);
    setLastExecution(null);
    setLastError(null);
  }

  function saveCurrentCall(label: string) {
    if (!selectedInstruction) {
      return;
    }

    const nextCall: ContractSavedCall = {
      id: crypto.randomUUID(),
      label,
      programKey: selectedProgramKey,
      instructionName: selectedInstruction.name,
      mode,
      argValues,
      accountOverrides,
      createdAt: new Date().toISOString(),
    };
    setSavedCalls((current) => [nextCall, ...current].slice(0, 16));
    toast.success("Saved contract call preset.");
  }

  function loadSavedCall(savedCall: ContractSavedCall) {
    skipNextResetCountRef.current = selectedProgramKey === savedCall.programKey ? 1 : 2;
    setSelectedProgramKey(savedCall.programKey);
    setSelectedInstructionName(savedCall.instructionName);
    setMode(savedCall.mode);
    setArgValues(savedCall.argValues);
    setAccountOverrides(savedCall.accountOverrides);
    setLastSimulation(null);
    setLastExecution(null);
    setLastError(null);
    toast.success(`Loaded preset: ${savedCall.label}`);
  }

  function deleteSavedCall(id: string) {
    setSavedCalls((current) => current.filter((entry) => entry.id !== id));
    toast.success("Saved contract call removed.");
  }

  function togglePinnedInstruction(programKey: ContractConsoleProgramKey, instructionName: string) {
    const badge = buildInstructionBadge(programKey, instructionName);
    setPinnedInstructionKeys((current) =>
      current.includes(badge) ? current.filter((entry) => entry !== badge) : [badge, ...current],
    );
  }

  function replayHistory(entry: ContractInstructionHistoryEntry) {
    skipNextResetCountRef.current = selectedProgramKey === entry.programKey ? 1 : 2;
    setSelectedProgramKey(entry.programKey);
    setSelectedInstructionName(entry.instructionName);
    setArgValues(entry.argValues);
    setAccountOverrides(entry.accountOverrides);
    setLastSimulation(null);
    setLastExecution(null);
    setLastError(null);
    toast.success("Instruction history restored into the console.");
  }

  function exportSavedCallPreset(call: ContractSavedCall) {
    void navigator.clipboard.writeText(exportSavedContractCall(call));
    toast.success("Saved call JSON copied.");
  }

  return {
    wallet,
    programs,
    selectedProgram,
    selectedProgramKey,
    setSelectedProgramKey,
    instructions,
    selectedInstruction,
    selectedInstructionName,
    setSelectedInstructionName,
    mode,
    setMode,
    argValues,
    updateArgValue,
    accountOverrides,
    updateAccountOverride,
    resolvedAccountsQuery,
    previewQuery,
    simulateMutation,
    executeMutation,
    lastSimulation,
    lastExecution,
    lastError,
    resetCurrentInstruction,
    savedCalls,
    saveCurrentCall,
    loadSavedCall,
    deleteSavedCall,
    exportSavedCallPreset,
    pinnedInstructionKeys,
    togglePinnedInstruction,
    instructionHistory,
    replayHistory,
    idlInspector,
    stateReaderAccountType,
    setStateReaderAccountType,
    stateReaderAddress,
    setStateReaderAddress,
    stateReaderQuery,
  };
}
