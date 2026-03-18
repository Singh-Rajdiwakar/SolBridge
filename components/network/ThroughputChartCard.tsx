"use client";

import type { NetworkMetricSeriesResponse } from "@/types";

import { MetricChartCard } from "@/components/network/MetricChartCard";

export function ThroughputChartCard({ data }: { data?: NetworkMetricSeriesResponse }) {
  return (
    <MetricChartCard
      title="Transaction Throughput"
      subtitle="Recent network traffic intensity translated into a user-facing throughput view."
      data={data?.points || []}
      color="#38bdf8"
      unit="tx/min"
      current={data?.current || 0}
      average={data?.average || 0}
      peak={data?.peak || 0}
      low={data?.low || 0}
      status={data?.usageIntensity || "normal"}
      variant="bar"
    />
  );
}
