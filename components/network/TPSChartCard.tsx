"use client";

import type { NetworkMetricSeriesResponse } from "@/types";

import { MetricChartCard } from "@/components/network/MetricChartCard";

export function TPSChartCard({ data }: { data?: NetworkMetricSeriesResponse }) {
  return (
    <MetricChartCard
      title="TPS Monitor"
      subtitle="Current and recent average transactions per second across the sampled network window."
      data={data?.points || []}
      color="#22d3ee"
      unit="TPS"
      current={data?.current || 0}
      average={data?.average || 0}
      peak={data?.peak || 0}
      low={data?.low || 0}
      status={data?.healthIndicator || "normal"}
      trailingMetric={
        data?.recentAverage !== undefined
          ? { label: "Recent Avg", value: `${data.recentAverage.toFixed(0)} TPS` }
          : undefined
      }
    />
  );
}
