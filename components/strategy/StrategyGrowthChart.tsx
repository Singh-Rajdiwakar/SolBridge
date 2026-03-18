"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import type { StrategySimulationResponse } from "@/types";
import { formatCompactCurrency } from "@/utils/format";

const tooltipStyle = {
  background: "rgba(8, 12, 28, 0.96)",
  border: "1px solid rgba(53, 216, 255, 0.12)",
  borderRadius: "16px",
};

export function StrategyGrowthChart({
  data,
  loading,
}: {
  data?: StrategySimulationResponse;
  loading?: boolean;
}) {
  return (
    <SectionCard
      title="Strategy Growth Projection"
      description="Modeled capital growth across the selected time horizon using current DeFi yield assumptions."
    >
      {loading ? (
        <div className="h-80 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
      ) : data?.growthSeries.length ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Starting Capital</div>
              <div className="mt-2 text-xl font-semibold text-white">{formatCompactCurrency(data.portfolioCapital)}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Projected Finish</div>
              <div className="mt-2 text-xl font-semibold text-emerald-300">
                {formatCompactCurrency(data.expectedYield.projectedTotalValue)}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Top Yield Driver</div>
              <div className="mt-2 text-xl font-semibold text-cyan-200">{data.explainability.highestYieldBucket}</div>
            </div>
          </div>
          <div className="h-80 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growthSeries}>
                <defs>
                  <linearGradient id="strategy-growth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} width={42} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCompactCurrency(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  fill="url(#strategy-growth)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Growth chart will appear after the strategy allocations total 100%.
        </div>
      )}
    </SectionCard>
  );
}
