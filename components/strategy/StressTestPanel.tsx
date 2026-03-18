"use client";

import { TriangleAlert } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { StrategySimulationResponse } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

export function StressTestPanel({
  data,
  loading,
}: {
  data?: StrategySimulationResponse;
  loading?: boolean;
}) {
  return (
    <SectionCard
      title="Stress Testing"
      description="Rule-based downside scenarios showing how risk, yield, and projected value respond when DeFi conditions worsen."
      action={
        <div className="inline-flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-500/[0.08] px-3 py-2 text-xs uppercase tracking-[0.18em] text-amber-100">
          <TriangleAlert className="h-4 w-4" />
          Scenario grid
        </div>
      }
    >
      {loading ? (
        <div className="h-72 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
      ) : data?.stressTests.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.stressTests.map((test) => (
            <div key={test.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">{test.label}</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">{test.description}</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-white/8 bg-black/20 p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Drawdown</div>
                  <div className="mt-2 text-base font-semibold text-rose-300">{formatPercent(test.drawdownPercent, 2)}</div>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/20 p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Updated Risk</div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {test.updatedRiskScore.toFixed(1)} • {test.updatedRiskLabel}
                  </div>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/20 p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Annual Yield</div>
                  <div className="mt-2 text-base font-semibold text-cyan-200">
                    {formatPercent(test.updatedAnnualYieldPercent, 2)}
                  </div>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/20 p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Projected Value</div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {formatCompactCurrency(test.updatedProjectedValue)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Stress scenarios appear after the current draft is simulated successfully.
        </div>
      )}
    </SectionCard>
  );
}
