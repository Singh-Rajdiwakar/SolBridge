"use client";

import type { NetworkMetricSeriesResponse } from "@/types";

import { MetricChartCard } from "@/components/network/MetricChartCard";

export function NetworkFeesCard({ data }: { data?: NetworkMetricSeriesResponse }) {
  return (
    <MetricChartCard
      title="Network Fees"
      subtitle="Average fee behavior and the practical fee range expected for recent Solana operations."
      data={data?.points || []}
      color="#14b8a6"
      unit="SOL"
      current={data?.current || 0}
      average={data?.average || 0}
      peak={data?.peak || 0}
      low={data?.low || 0}
      status="fee-monitor"
      trailingMetric={
        data?.feeBuckets
          ? { label: "High Bucket", value: `${data.feeBuckets.high.toFixed(6)} SOL` }
          : undefined
      }
    />
  );
}
