"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useActiveWallet } from "@/hooks/use-active-wallet";
import {
  compareStrategyPlans,
  createStrategyPlan,
  deleteStrategyPlan,
  listStrategyPlans,
  simulateStrategyPlan,
  updateStrategyPlan,
  type StrategyDraftPayload,
} from "@/services/strategyService";
import { walletApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import type {
  StrategyPlanRecord,
  StrategyScenario,
  StrategySimulationResponse,
  StrategyTimeframe,
} from "@/types";
import {
  DEFAULT_STRATEGY_ASSUMPTIONS,
  DEFAULT_STRATEGY_ALLOCATIONS,
  STRATEGY_PRESETS,
} from "@/components/strategy/strategy-config";

function round(value: number, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function totalAllocation(allocations: StrategyDraftPayload["allocations"]) {
  return round(
    Object.values(allocations).reduce((sum, value) => sum + Number(value || 0), 0),
    2,
  );
}

function slugify(value: string) {
  return value.trim().toLowerCase();
}

export interface StrategyDraftState extends StrategyDraftPayload {
  strategyId?: string;
}

export function useStrategyBuilder() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const wallet = useActiveWallet();
  const [presetKey, setPresetKey] = useState("balanced-growth");
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [draft, setDraft] = useState<StrategyDraftState>({
    name: "Balanced Growth",
    allocations: DEFAULT_STRATEGY_ALLOCATIONS,
    portfolioCapital: 10000,
    timeframe: "1Y",
    scenario: "base",
    assumptions: DEFAULT_STRATEGY_ASSUMPTIONS,
    notes: "",
  });
  const deferredDraft = useDeferredValue(draft);

  const portfolioSeedQuery = useQuery({
    queryKey: ["strategy", "portfolio-seed", wallet.address],
    queryFn: () => walletApi.portfolio(wallet.address!, wallet.providerName || "Retix Wallet"),
    enabled: Boolean(wallet.address),
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (
      portfolioSeedQuery.data?.totalPortfolioUsd &&
      draft.portfolioCapital === 10000 &&
      !draft.strategyId
    ) {
      setDraft((current) => ({
        ...current,
        portfolioCapital: round(portfolioSeedQuery.data!.totalPortfolioUsd, 2),
      }));
    }
  }, [draft.portfolioCapital, draft.strategyId, portfolioSeedQuery.data]);

  const strategiesQuery = useQuery({
    queryKey: ["strategy", "plans"],
    queryFn: listStrategyPlans,
    enabled: Boolean(authUser),
    staleTime: 1000 * 45,
  });

  const allocationTotal = useMemo(() => totalAllocation(draft.allocations), [draft.allocations]);
  const deferredAllocationTotal = useMemo(
    () => totalAllocation(deferredDraft.allocations),
    [deferredDraft.allocations],
  );
  const allocationValid = allocationTotal === 100;

  const simulationQuery = useQuery({
    queryKey: ["strategy", "simulate", deferredDraft],
    queryFn: () => simulateStrategyPlan(deferredDraft),
    enabled: Boolean(authUser) && deferredAllocationTotal === 100 && deferredDraft.portfolioCapital >= 100,
    staleTime: 1000 * 20,
  });

  const comparisonQuery = useQuery({
    queryKey: ["strategy", "compare", selectedStrategyIds, deferredDraft],
    queryFn: () =>
      compareStrategyPlans({
        strategyIds: selectedStrategyIds,
        strategies: [
          {
            ...deferredDraft,
            strategyId: deferredDraft.strategyId,
          },
        ],
      }),
    enabled:
      Boolean(authUser) &&
      deferredAllocationTotal === 100 &&
      deferredDraft.portfolioCapital >= 100 &&
      selectedStrategyIds.length > 0,
    staleTime: 1000 * 20,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; notes: string }) => {
      const duplicate = (strategiesQuery.data || []).find(
        (item) =>
          slugify(item.name) === slugify(payload.name) &&
          (!draft.strategyId || item._id !== draft.strategyId),
      );

      if (duplicate) {
        throw new Error("Strategy name already exists.");
      }

      const nextPayload = {
        ...draft,
        name: payload.name,
        notes: payload.notes,
      };

      if (draft.strategyId) {
        return updateStrategyPlan(draft.strategyId, nextPayload);
      }
      return createStrategyPlan(nextPayload);
    },
    onSuccess: (saved) => {
      setDraft((current) => ({
        ...current,
        name: saved.name,
        notes: saved.notes || "",
        strategyId: saved._id,
      }));
      setSaveModalOpen(false);
      toast.success("Strategy saved");
      void queryClient.invalidateQueries({ queryKey: ["strategy", "plans"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save strategy");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStrategyPlan,
    onSuccess: (_data, strategyId) => {
      setSelectedStrategyIds((current) => current.filter((item) => item !== strategyId));
      if (draft.strategyId === strategyId) {
        setDraft({
          name: "Balanced Growth",
          allocations: DEFAULT_STRATEGY_ALLOCATIONS,
          portfolioCapital: draft.portfolioCapital,
          timeframe: "1Y",
          scenario: "base",
          assumptions: DEFAULT_STRATEGY_ASSUMPTIONS,
          notes: "",
        });
        setPresetKey("balanced-growth");
      }
      toast.success("Strategy removed");
      void queryClient.invalidateQueries({ queryKey: ["strategy", "plans"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete strategy");
    },
  });

  const currentSimulation = simulationQuery.data;

  const savedStrategies = strategiesQuery.data || [];

  const updateAllocation = (key: keyof StrategyDraftPayload["allocations"], value: number) => {
    setDraft((current) => ({
      ...current,
      strategyId: undefined,
      allocations: {
        ...current.allocations,
        [key]: round(Math.max(0, Math.min(100, value)), 2),
      },
    }));
  };

  const updateAssumption = (key: keyof NonNullable<StrategyDraftPayload["assumptions"]>, value: string) => {
    setDraft((current) => ({
      ...current,
      strategyId: undefined,
      assumptions: {
        ...current.assumptions,
        [key]: value,
      },
    }));
  };

  const applyPreset = (key: string) => {
    const preset = STRATEGY_PRESETS.find((item) => item.key === key);
    if (!preset) {
      return;
    }

    setPresetKey(key);
    setDraft((current) => ({
      ...current,
      strategyId: undefined,
      name: preset.label,
      allocations: preset.allocations,
      timeframe: preset.timeframe,
      scenario: preset.scenario,
      assumptions: preset.assumptions,
      notes: preset.description,
    }));
  };

  const loadSavedStrategy = (strategy: StrategyPlanRecord) => {
    setPresetKey("");
    setDraft({
      strategyId: strategy._id,
      name: strategy.name,
      allocations: strategy.allocations,
      portfolioCapital: strategy.portfolioCapital,
      timeframe: strategy.timeframe,
      scenario: strategy.scenario,
      assumptions: {
        ...DEFAULT_STRATEGY_ASSUMPTIONS,
        ...(strategy.assumptions || {}),
      },
      notes: strategy.notes || "",
    });
    toast.success(`Loaded ${strategy.name}`);
  };

  const toggleCompareStrategy = (strategyId: string) => {
    setSelectedStrategyIds((current) =>
      current.includes(strategyId)
        ? current.filter((item) => item !== strategyId)
        : current.length >= 3
          ? [...current.slice(1), strategyId]
          : [...current, strategyId],
    );
  };

  const resetStrategy = () => {
    applyPreset("balanced-growth");
    setSelectedStrategyIds([]);
    toast.success("Strategy reset to balanced preset");
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["strategy", "plans"] }),
      queryClient.invalidateQueries({ queryKey: ["strategy", "simulate"] }),
      queryClient.invalidateQueries({ queryKey: ["strategy", "compare"] }),
    ]);
  };

  const exportCurrentStrategy = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      strategy: draft,
      simulation: currentSimulation,
      comparison: comparisonQuery.data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(draft.name || "strategy-plan") || "strategy-plan"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Strategy exported");
  };

  return {
    authUser,
    wallet,
    portfolioSeedQuery,
    draft,
    setDraft,
    allocationTotal,
    allocationValid,
    presetKey,
    setPresetKey,
    applyPreset,
    updateAllocation,
    updateAssumption,
    resetStrategy,
    strategiesQuery,
    savedStrategies,
    loadSavedStrategy,
    selectedStrategyIds,
    toggleCompareStrategy,
    simulationQuery,
    currentSimulation,
    comparisonQuery,
    saveModalOpen,
    setSaveModalOpen,
    saveMutation,
    deleteMutation,
    refresh,
    exportCurrentStrategy,
  };
}
