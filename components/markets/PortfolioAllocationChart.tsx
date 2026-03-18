"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatMarketCurrency } from "@/components/markets/utils";

const COLORS = ["#3B82F6", "#22D3EE", "#60A5FA", "#06B6D4", "#34D399", "#F59E0B"];

export function PortfolioAllocationChart({
  data,
  currency,
}: {
  data: Array<{ name: string; value: number }>;
  currency: string;
}) {
  return (
    <div className="glass-panel border-white/8 p-5">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Portfolio Distribution</div>
        <div className="mt-2 text-xl font-semibold text-white">Allocation by holding value</div>
      </div>
      <div className="h-[18rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "rgba(10,16,32,0.95)",
                border: "1px solid rgba(120,170,255,0.14)",
                borderRadius: 10,
              }}
              formatter={(value: number) => formatMarketCurrency(Number(value), currency)}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={68}
              outerRadius={88}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between rounded-md border border-white/8 bg-white/[0.03] px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {entry.name}
            </div>
            <span className="font-medium text-white">{formatMarketCurrency(entry.value, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
