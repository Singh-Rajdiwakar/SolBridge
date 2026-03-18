"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/dashboard/empty-state";
import { SectionCard } from "@/components/dashboard/section-card";
import type { TreasuryFlowsResponse } from "@/types";
import { formatCompactCurrency } from "@/utils/format";

export function TreasuryFlowChart({ data }: { data?: TreasuryFlowsResponse }) {
  return (
    <SectionCard title="Treasury Inflows and Outflows" description="Mirrored treasury movements over time from indexed transaction activity.">
      {!data?.monthly?.length ? (
        <EmptyState title="No treasury flow history" description="Inflows and outflows will populate once treasury-bound transactions are mirrored." />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-emerald-200">Inflows</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCompactCurrency(data.inflowTotal)}</div>
            </div>
            <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-rose-200">Outflows</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCompactCurrency(data.outflowTotal)}</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCompactCurrency(value)} />
                <Tooltip
                  formatter={(value: number) => formatCompactCurrency(value)}
                  contentStyle={{
                    background: "rgba(8, 12, 28, 0.96)",
                    border: "1px solid rgba(53, 216, 255, 0.12)",
                    borderRadius: "16px",
                  }}
                />
                <Bar dataKey="inflow" fill="#22C55E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="outflow" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
