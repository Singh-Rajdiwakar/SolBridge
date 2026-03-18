"use client";

import type { NetworkMetricSeriesResponse } from "@/types";

import { MetricChartCard } from "@/components/network/MetricChartCard";

export function RPCLatencyCard({ data }: { data?: NetworkMetricSeriesResponse }) {
  return (
    <MetricChartCard
      title="RPC Latency"
      subtitle="Direct latency monitoring for the configured RPC endpoint used by the application."
      data={data?.points || []}
      color="#22c55e"
      unit="ms"
      current={data?.current || 0}
      average={data?.average || 0}
      peak={data?.peak || 0}
      low={data?.low || 0}
      status={data?.endpointLabel || "rpc"}
      trailingMetric={
        data?.bestRecentLatency !== undefined
          ? { label: "Best Recent", value: `${data.bestRecentLatency.toFixed(0)} ms` }
          : undefined
      }
    />
  );
}
