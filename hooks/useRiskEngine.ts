"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { riskApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import type { RiskRange, RiskScenario } from "@/types";

export function useRiskEngine(walletAddress?: string) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const effectiveWalletAddress = walletAddress || authUser?.walletAddress || "";
  const [range, setRange] = useState<RiskRange>("30D");
  const [scenario, setScenario] = useState<RiskScenario>("sol-drop-10");

  const summaryQuery = useQuery({
    queryKey: ["risk", "summary", effectiveWalletAddress],
    queryFn: () => riskApi.summary(effectiveWalletAddress),
    enabled: Boolean(effectiveWalletAddress),
    staleTime: 1000 * 30,
  });

  const breakdownQuery = useQuery({
    queryKey: ["risk", "breakdown", effectiveWalletAddress],
    queryFn: () => riskApi.breakdown(effectiveWalletAddress),
    enabled: Boolean(effectiveWalletAddress),
    staleTime: 1000 * 30,
  });

  const trendQuery = useQuery({
    queryKey: ["risk", "trend", effectiveWalletAddress, range],
    queryFn: () => riskApi.trend(effectiveWalletAddress, range),
    enabled: Boolean(effectiveWalletAddress),
    staleTime: 1000 * 45,
  });

  const eventsQuery = useQuery({
    queryKey: ["risk", "events", effectiveWalletAddress],
    queryFn: () => riskApi.events(effectiveWalletAddress),
    enabled: Boolean(effectiveWalletAddress),
    staleTime: 1000 * 30,
  });

  const recommendationsQuery = useQuery({
    queryKey: ["risk", "recommendations", effectiveWalletAddress],
    queryFn: () => riskApi.recommendations(effectiveWalletAddress),
    enabled: Boolean(effectiveWalletAddress),
    staleTime: 1000 * 45,
  });

  const stressTestMutation = useMutation({
    mutationFn: () => riskApi.stressTest({ walletAddress: effectiveWalletAddress, scenario }),
  });

  const isLoading = useMemo(
    () =>
      summaryQuery.isLoading ||
      breakdownQuery.isLoading ||
      trendQuery.isLoading ||
      eventsQuery.isLoading ||
      recommendationsQuery.isLoading,
    [
      breakdownQuery.isLoading,
      eventsQuery.isLoading,
      recommendationsQuery.isLoading,
      summaryQuery.isLoading,
      trendQuery.isLoading,
    ],
  );

  const refresh = async () => {
    if (!effectiveWalletAddress) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["risk", "summary", effectiveWalletAddress] }),
      queryClient.invalidateQueries({ queryKey: ["risk", "breakdown", effectiveWalletAddress] }),
      queryClient.invalidateQueries({ queryKey: ["risk", "trend", effectiveWalletAddress] }),
      queryClient.invalidateQueries({ queryKey: ["risk", "events", effectiveWalletAddress] }),
      queryClient.invalidateQueries({ queryKey: ["risk", "recommendations", effectiveWalletAddress] }),
    ]);
  };

  return {
    walletAddress: effectiveWalletAddress,
    range,
    setRange,
    scenario,
    setScenario,
    summaryQuery,
    breakdownQuery,
    trendQuery,
    eventsQuery,
    recommendationsQuery,
    stressTestMutation,
    isLoading,
    refresh,
  };
}
