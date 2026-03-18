"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import type { StrategySimulationResponse } from "@/types";
import { formatCompactCurrency } from "@/utils/format";

const COLORS = ["#22d3ee", "#3b82f6", "#22c55e", "#94a3b8", "#a855f7", "#f59e0b"];

export function AllocationBreakdownChart({
  data,
  loading,
}: {
  data?: StrategySimulationResponse;
  loading?: boolean;
}) {
  return (
    <SectionCard
      title="Allocation & Exposure Breakdown"
      description="See how capital and expected annual reward are distributed across each DeFi bucket."
    >
      {loading ? (
        <div className="h-80 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
      ) : data?.allocationBreakdown.length ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="h-80 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.allocationBreakdown}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={3}
                >
                  {data.allocationBreakdown.map((entry, index) => (
                    <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(8, 12, 28, 0.96)",
                    border: "1px solid rgba(53, 216, 255, 0.12)",
                    borderRadius: "16px",
                  }}
                  formatter={(value: number) => `${Number(value).toFixed(2)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {data.allocationBreakdown.map((item, index) => (
              <div key={item.key} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatCompactCurrency(item.capitalAllocated)} deployed</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold text-white">{item.value.toFixed(1)}%</div>
                    <div className="mt-1 text-xs text-slate-500">{item.annualYieldRate.toFixed(2)}% modeled APY</div>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/8">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-cyan-400/15 bg-cyan-500/[0.06] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Highest Yield Bucket</div>
                <div className="mt-2 text-lg font-semibold text-white">{data.explainability.highestYieldBucket}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Diversity Score</div>
                <div className="mt-2 text-lg font-semibold text-white">{data.explainability.diversityScore.toFixed(1)}/100</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Allocation breakdown becomes available once the current strategy is valid and simulated.
        </div>
      )}
    </SectionCard>
  );
}
