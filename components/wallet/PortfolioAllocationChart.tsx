"use client";

import { PieChart as PieIcon, TrendingUp } from "lucide-react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { GlassCard, SectionHeader } from "@/components/shared";
import type { WalletAllocationItem, WalletBalanceHistoryPoint } from "@/types";
import { formatCurrency } from "@/utils/format";

const chartColors = ["#22D3EE", "#3B82F6", "#60A5FA", "#2DD4BF", "#7DD3FC", "#93C5FD"];

export function PortfolioAllocationChart({
  allocation,
  history,
}: {
  allocation: WalletAllocationItem[];
  history: WalletBalanceHistoryPoint[];
}) {
  return (
    <GlassCard className="h-full">
      <SectionHeader
        title="Portfolio Analytics"
        subtitle="Donut allocation and portfolio growth combined into a single analytics panel."
        action={
          <div className="flex items-center gap-2 text-cyan-300">
            <PieIcon className="h-4 w-4" />
            <TrendingUp className="h-4 w-4" />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Asset Distribution</div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={86}
                  stroke="rgba(10,16,32,0.9)"
                  paddingAngle={2}
                >
                  {allocation.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid rgba(120,170,255,0.14)",
                    background: "rgba(10,16,32,0.96)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid gap-2">
            {allocation.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                  {entry.name}
                </div>
                <div className="text-white">{formatCurrency(entry.value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Portfolio Growth</div>
          <div className="mt-1 text-sm text-slate-400">Refined balance history across the last 7 sessions</div>
          <div className="mt-4 h-[19.5rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <Line type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={2.2} dot={false} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid rgba(120,170,255,0.14)",
                    background: "rgba(10,16,32,0.96)",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
