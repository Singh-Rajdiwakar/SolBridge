"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskProtocolExposureItem } from "@/types";
import { formatCurrency, formatPercent } from "@/utils/format";

const COLORS = ["#38bdf8", "#14b8a6", "#8b5cf6", "#f59e0b", "#fb7185"];

export function ProtocolExposureChart({ data }: { data?: RiskProtocolExposureItem[] }) {
  return (
    <SectionCard
      title="Protocol Exposure"
      description="Visible portfolio allocation split by spot holdings, staking, liquidity, lending, and governance hold."
    >
      {data?.length ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="h-[260px] rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="label" innerRadius={64} outerRadius={92} paddingAngle={3}>
                  {data.map((item, index) => (
                    <Cell key={item.key} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    background: "rgba(5, 8, 22, 0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.8rem",
                    color: "#e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.key} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div className="text-sm font-medium text-white">{item.label}</div>
                  </div>
                  <div className="text-sm text-slate-300">{formatPercent(item.percentage)}</div>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{formatCurrency(item.value)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Protocol exposure will appear after active wallet holdings are detected.
        </div>
      )}
    </SectionCard>
  );
}
