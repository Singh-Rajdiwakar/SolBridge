"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { treasuryApi } from "@/services/api";
import type { TreasuryRange } from "@/types";

export function useTreasury(initialRange: TreasuryRange = "30D") {
  const [range, setRange] = useState<TreasuryRange>(initialRange);

  const overviewQuery = useQuery({
    queryKey: ["treasury", "overview"],
    queryFn: treasuryApi.overview,
    staleTime: 60_000,
  });

  const assetsQuery = useQuery({
    queryKey: ["treasury", "assets"],
    queryFn: treasuryApi.assets,
    staleTime: 60_000,
  });

  const allocationQuery = useQuery({
    queryKey: ["treasury", "allocation"],
    queryFn: treasuryApi.allocation,
    staleTime: 60_000,
  });

  const growthQuery = useQuery({
    queryKey: ["treasury", "growth", range],
    queryFn: () => treasuryApi.growth(range),
    staleTime: 60_000,
  });

  const healthQuery = useQuery({
    queryKey: ["treasury", "health"],
    queryFn: treasuryApi.health,
    staleTime: 60_000,
  });

  const runwayQuery = useQuery({
    queryKey: ["treasury", "runway"],
    queryFn: treasuryApi.runway,
    staleTime: 60_000,
  });

  const proposalsQuery = useQuery({
    queryKey: ["treasury", "proposals"],
    queryFn: treasuryApi.proposals,
    staleTime: 60_000,
  });

  const flowsQuery = useQuery({
    queryKey: ["treasury", "flows"],
    queryFn: treasuryApi.flows,
    staleTime: 60_000,
  });

  const eventsQuery = useQuery({
    queryKey: ["treasury", "events"],
    queryFn: treasuryApi.events,
    staleTime: 60_000,
  });

  const isLoading = [
    overviewQuery,
    assetsQuery,
    allocationQuery,
    growthQuery,
    healthQuery,
    runwayQuery,
    proposalsQuery,
    flowsQuery,
    eventsQuery,
  ].some((query) => query.isLoading);

  const isConfigured = Boolean(overviewQuery.data?.configured);

  return useMemo(
    () => ({
      range,
      setRange,
      isLoading,
      isConfigured,
      overviewQuery,
      assetsQuery,
      allocationQuery,
      growthQuery,
      healthQuery,
      runwayQuery,
      proposalsQuery,
      flowsQuery,
      eventsQuery,
    }),
    [
      allocationQuery,
      assetsQuery,
      eventsQuery,
      flowsQuery,
      growthQuery,
      healthQuery,
      isConfigured,
      isLoading,
      overviewQuery,
      proposalsQuery,
      range,
      runwayQuery,
    ],
  );
}
