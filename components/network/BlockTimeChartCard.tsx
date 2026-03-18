"use client";

import type { NetworkMetricSeriesResponse } from "@/types";

import { MetricChartCard } from "@/components/network/MetricChartCard";

export function BlockTimeChartCard({ data }: { data?: NetworkMetricSeriesResponse }) {
  return (
    <MetricChartCard
      title="Block Time Monitor"
      subtitle="Confirmation cadence and block production stability across the selected timeframe."
      data={data?.points || []}
      color="#3b82f6"
      unit="s"
      current={data?.current || 0}
      average={data?.average || 0}
      peak={data?.peak || 0}
      low={data?.low || 0}
      status={data?.stabilityLabel || "stable"}
      trailingMetric={
        data?.deviation !== undefined
          ? { label: "Deviation", value: `${data.deviation.toFixed(3)} s` }
          : undefined
      }
    />
  );
}
