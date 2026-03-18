"use client";

import { Activity } from "lucide-react";

import { GlassCard } from "@/components/shared";
import type { StrategySimulationResponse } from "@/types";
import { formatCompactCurrency } from "@/utils/format";

export function VolatilityImpactCard({
  data,
  loading,
}: {
  data?: StrategySimulationResponse;
  loading?: boolean;
}) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />;
  }

  return (
    <GlassCard className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Volatility Impact</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {data ? `${data.volatility.score.toFixed(1)}/100` : "--"}
          </div>
          <div className="mt-2 text-sm text-slate-400">{data?.volatility.label || "Volatility state unavailable"}</div>
        </div>
        <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
          <Activity className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          { label: "Best Case", value: data ? formatCompactCurrency(data.volatility.scenarioOutlook.bestCase) : "--" },
          { label: "Base Case", value: data ? formatCompactCurrency(data.volatility.scenarioOutlook.baseCase) : "--" },
          { label: "Adverse Case", value: data ? formatCompactCurrency(data.volatility.scenarioOutlook.adverseCase) : "--" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
            <div className="mt-2 text-base font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Low Range", value: data ? data.volatility.range.bestCase.toFixed(1) : "--" },
          { label: "Base Range", value: data ? data.volatility.range.baseCase.toFixed(1) : "--" },
          { label: "Stress Range", value: data ? data.volatility.range.adverseCase.toFixed(1) : "--" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-white/8 bg-black/20 p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
            <div className="mt-2 text-base font-semibold text-slate-100">{item.value}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
