"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { EmptyState } from "@/components/dashboard/empty-state";
import { SectionCard } from "@/components/dashboard/section-card";
import type { TreasuryAllocationResponse } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

const COLORS = ["#35D8FF", "#3B82F6", "#22C55E", "#F59E0B", "#A855F7", "#EF4444"];

export function TreasuryAllocationChart({ data }: { data?: TreasuryAllocationResponse }) {
  return (
    <SectionCard title="Token Allocation Breakdown" description="Token and category concentration across the treasury reserve mix.">
      {!data?.tokenAllocation?.length ? (
        <EmptyState title="No treasury allocation yet" description="Token allocation appears once treasury wallets expose on-chain balances." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.tokenAllocation}
                  dataKey="value"
                  nameKey="symbol"
                  innerRadius={74}
                  outerRadius={112}
                  paddingAngle={2}
                  stroke="rgba(8,12,28,0.8)"
                  strokeWidth={2}
                >
                  {data.tokenAllocation.map((entry, index) => (
                    <Cell key={`${entry.symbol}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCompactCurrency(value)}
                  contentStyle={{
                    background: "rgba(8, 12, 28, 0.96)",
                    border: "1px solid rgba(53, 216, 255, 0.12)",
                    borderRadius: "16px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {data.tokenAllocation.map((item, index) => (
              <div key={`${item.symbol}-${item.category}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div>
                      <div className="text-sm font-medium text-white">{item.symbol || item.category}</div>
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.category || "token allocation"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{formatPercent(item.allocationPercent)}</div>
                    <div className="text-xs text-slate-500">{formatCompactCurrency(item.value)}</div>
                  </div>
                </div>
              </div>
            ))}
            {data.concentrationWarning ? (
              <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {data.concentrationWarning}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
