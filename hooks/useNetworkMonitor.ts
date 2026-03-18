"use client";

import { useQuery } from "@tanstack/react-query";

import { networkMonitorService } from "@/services/networkMonitorService";
import type { NetworkMonitorRange } from "@/types";

export function useNetworkMonitor({
  range,
  autoRefresh = true,
  eventsLimit = 14,
}: {
  range: NetworkMonitorRange;
  autoRefresh?: boolean;
  eventsLimit?: number;
}) {
  const refetchInterval = autoRefresh ? 30000 : false;

  const overviewQuery = useQuery({
    queryKey: ["network-monitor", "overview", range],
    queryFn: () => networkMonitorService.getOverview(range),
    staleTime: 15000,
    refetchInterval,
  });
  const detailsEnabled = overviewQuery.isSuccess;

  const tpsQuery = useQuery({
    queryKey: ["network-monitor", "tps", range],
    queryFn: () => networkMonitorService.getTps(range),
    staleTime: 15000,
    refetchInterval,
    enabled: detailsEnabled,
  });

  const blockTimeQuery = useQuery({
    queryKey: ["network-monitor", "block-time", range],
    queryFn: () => networkMonitorService.getBlockTime(range),
    staleTime: 15000,
    refetchInterval,
    enabled: detailsEnabled,
  });

  const throughputQuery = useQuery({
    queryKey: ["network-monitor", "throughput", range],
    queryFn: () => networkMonitorService.getThroughput(range),
    staleTime: 15000,
    refetchInterval,
    enabled: detailsEnabled,
  });

  const feesQuery = useQuery({
    queryKey: ["network-monitor", "fees", range],
    queryFn: () => networkMonitorService.getFees(range),
    staleTime: 15000,
    refetchInterval,
    enabled: detailsEnabled,
  });

  const validatorsQuery = useQuery({
    queryKey: ["network-monitor", "validators", range],
    queryFn: () => networkMonitorService.getValidators(range),
    staleTime: 30000,
    refetchInterval,
    enabled: detailsEnabled,
  });

  const rpcLatencyQuery = useQuery({
    queryKey: ["network-monitor", "rpc-latency", range],
    queryFn: () => networkMonitorService.getRpcLatency(range),
    staleTime: 15000,
    refetchInterval,
    enabled: detailsEnabled,
  });

  const healthQuery = useQuery({
    queryKey: ["network-monitor", "health", range],
    queryFn: () => networkMonitorService.getHealth(range),
    staleTime: 15000,
    refetchInterval,
    enabled: detailsEnabled,
  });

  const eventsQuery = useQuery({
    queryKey: ["network-monitor", "events", eventsLimit],
    queryFn: () => networkMonitorService.getEvents(eventsLimit),
    staleTime: 15000,
    refetchInterval,
    enabled: detailsEnabled,
  });

  return {
    overviewQuery,
    tpsQuery,
    blockTimeQuery,
    throughputQuery,
    feesQuery,
    validatorsQuery,
    rpcLatencyQuery,
    healthQuery,
    eventsQuery,
  };
}
