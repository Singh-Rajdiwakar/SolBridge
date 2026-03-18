"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useActiveWallet } from "@/hooks/use-active-wallet";
import { crossWalletApi, taxApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";

function currentYearRange(year: number) {
  return {
    startDate: new Date(Date.UTC(year, 0, 1)).toISOString().slice(0, 10),
    endDate: new Date(Date.UTC(year, 11, 31)).toISOString().slice(0, 10),
  };
}

function normalizeCsvInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function triggerDownload(filename: string, content: string, mimeType: string, encoding?: "base64") {
  const blob =
    encoding === "base64"
      ? new Blob([Uint8Array.from(atob(content), (char) => char.charCodeAt(0))], { type: mimeType })
      : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useTaxReports() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const wallet = useActiveWallet();
  const currentYear = new Date().getFullYear();
  const [scopeType, setScopeType] = useState<"wallet" | "group">("wallet");
  const [year, setYear] = useState(currentYear);
  const [dateRange, setDateRange] = useState(currentYearRange(currentYear));
  const [includeProtocols, setIncludeProtocols] = useState<string[]>([]);
  const [excludeProtocols, setExcludeProtocols] = useState<string[]>([]);
  const [includeTokensInput, setIncludeTokensInput] = useState("");
  const [excludeTokensInput, setExcludeTokensInput] = useState("");

  const walletOptions = useMemo(() => {
    const entries = new Map<string, { value: string; label: string }>();
    if (authUser?.walletAddress) {
      entries.set(authUser.walletAddress, {
        value: authUser.walletAddress,
        label: `Primary • ${authUser.walletAddress.slice(0, 4)}...${authUser.walletAddress.slice(-4)}`,
      });
    }
    (authUser?.linkedWallets || []).forEach((linkedWallet) => {
      entries.set(linkedWallet.address, {
        value: linkedWallet.address,
        label:
          linkedWallet.label ||
          `${linkedWallet.provider.toUpperCase()} • ${linkedWallet.address.slice(0, 4)}...${linkedWallet.address.slice(-4)}`,
      });
    });
    if (wallet.address && !entries.has(wallet.address)) {
      entries.set(wallet.address, {
        value: wallet.address,
        label: `Connected • ${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`,
      });
    }
    return Array.from(entries.values());
  }, [authUser?.linkedWallets, authUser?.walletAddress, wallet.address]);

  const [selectedWallet, setSelectedWallet] = useState(walletOptions[0]?.value || authUser?.walletAddress || wallet.address || "");
  const groupsQuery = useQuery({
    queryKey: ["cross-wallet", "groups"],
    queryFn: () => crossWalletApi.groups(),
    enabled: Boolean(authUser),
    staleTime: 1000 * 60,
  });
  const [selectedGroupId, setSelectedGroupId] = useState("");

  useEffect(() => {
    if (!selectedWallet && walletOptions.length > 0) {
      setSelectedWallet(walletOptions[0].value);
    }
  }, [selectedWallet, walletOptions]);

  useEffect(() => {
    if (!selectedGroupId && groupsQuery.data?.length) {
      setSelectedGroupId(groupsQuery.data[0]._id);
    }
  }, [groupsQuery.data, selectedGroupId]);

  const params = useMemo(
    () => ({
      year,
      startDate: dateRange.startDate ? new Date(dateRange.startDate).toISOString() : undefined,
      endDate: dateRange.endDate ? new Date(`${dateRange.endDate}T23:59:59.999Z`).toISOString() : undefined,
      includeProtocols,
      excludeProtocols,
      includeTokens: normalizeCsvInput(includeTokensInput),
      excludeTokens: normalizeCsvInput(excludeTokensInput),
    }),
    [dateRange.endDate, dateRange.startDate, excludeProtocols, excludeTokensInput, includeProtocols, includeTokensInput, year],
  );

  const reportQuery = useQuery({
    queryKey: ["tax", "report", scopeType, selectedWallet, selectedGroupId, params],
    queryFn: () =>
      scopeType === "group"
        ? taxApi.yearlyGroupReport(selectedGroupId, params)
        : taxApi.yearlyReport(selectedWallet, params),
    enabled: scopeType === "group" ? Boolean(selectedGroupId) : Boolean(selectedWallet),
    staleTime: 1000 * 45,
  });

  const exportMutation = useMutation({
    mutationFn: async (format: "json" | "csv" | "pdf") => {
      const payload = {
        ...(scopeType === "group" ? { groupId: selectedGroupId } : { walletAddress: selectedWallet }),
        ...params,
      };

      if (format === "csv") {
        return taxApi.exportCsv(payload);
      }
      if (format === "pdf") {
        return taxApi.exportPdf(payload);
      }
      return taxApi.exportJson(payload);
    },
    onSuccess: (result) => {
      triggerDownload(result.filename, result.content, result.mimeType, result.encoding);
      toast.success(`${result.format.toUpperCase()} report exported`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Export failed");
    },
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tax"] });
  };

  return {
    scopeType,
    setScopeType,
    year,
    setYear: (nextYear: number) => {
      setYear(nextYear);
      setDateRange(currentYearRange(nextYear));
    },
    dateRange,
    setDateRange,
    includeProtocols,
    setIncludeProtocols,
    excludeProtocols,
    setExcludeProtocols,
    includeTokensInput,
    setIncludeTokensInput,
    excludeTokensInput,
    setExcludeTokensInput,
    walletOptions,
    selectedWallet,
    setSelectedWallet,
    groupsQuery,
    selectedGroupId,
    setSelectedGroupId,
    reportQuery,
    exportMutation,
    refresh,
  };
}
