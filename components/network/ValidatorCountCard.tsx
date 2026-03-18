"use client";

import type { NetworkMetricSeriesResponse } from "@/types";

import { MetricChartCard } from "@/components/network/MetricChartCard";

export function ValidatorCountCard({ data }: { data?: NetworkMetricSeriesResponse }) {
  return (
    <MetricChartCard
      title="Validator Count"
      subtitle="Active validator presence and recent validator-count stability for decentralization awareness."
      data={data?.points || []}
      color="#60a5fa"
      unit=""
      current={data?.current || 0}
      average={data?.average || 0}
      peak={data?.peak || 0}
      low={data?.low || 0}
      status="validator-monitor"
      trailingMetric={
        data?.activeValidators !== undefined
          ? { label: "Delinquent", value: `${data.delinquentValidators || 0}` }
          : undefined
      }
    />
  );
}
