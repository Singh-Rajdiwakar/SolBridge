"use client";

import { TrendingUp } from "lucide-react";

import { GlassCard } from "@/components/shared";
import type { StrategySimulationResponse } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

export function ExpectedYieldCard({
  data,
  loading,
}: {
  data?: StrategySimulationResponse;
  loading?: boolean;
}) {
  if (loading) {
    return <div className="h-52 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />;
  }

  return (
    <GlassCard className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Expected Yield</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {data ? formatPercent(data.expectedYield.annualPercent, 2) : "--"}
          </div>
          <div className="mt-2 text-sm text-slate-400">
            {data ? `${formatCompactCurrency(data.expectedYield.annualUsd)} annualized return` : "Waiting for a valid 100% allocation mix"}
          </div>
        </div>
        <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
          <TrendingUp className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          { label: "Daily Yield", value: data ? formatCompactCurrency(data.expectedYield.dailyUsd) : "--" },
          { label: "Monthly Yield", value: data ? formatCompactCurrency(data.expectedYield.monthlyUsd) : "--" },
          { label: "Projected Value", value: data ? formatCompactCurrency(data.expectedYield.projectedTotalValue) : "--" },
          { label: "Balance Profile", value: data?.explainability.balanceProfile || "--" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
            <div className="mt-2 text-lg font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
