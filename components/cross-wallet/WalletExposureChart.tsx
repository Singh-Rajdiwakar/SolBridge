"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import type { CrossWalletSummaryResponse } from "@/types";
import { formatCurrency } from "@/utils/format";

const exposureColors = ["#3b82f6", "#22d3ee", "#2dd4bf", "#f59e0b", "#93c5fd"];

export function WalletExposureChart({ data }: { data?: CrossWalletSummaryResponse }) {
  if (!data) {
    return (
      <SectionCard title="Exposure Breakdown" description="Spot, staking, liquidity, lending, and governance mix across all tracked wallets.">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Exposure analytics will appear once group summary data is available.
        </div>
      </SectionCard>
    );
  }

  const totals = data.wallets.reduce(
    (acc, wallet) => {
      acc.staking += wallet.exposures.staking;
      acc.liquidity += wallet.exposures.liquidity;
      acc.lending += wallet.exposures.lending;
      acc.governance += wallet.exposures.governance;
      acc.spot += wallet.exposures.spot;
      return acc;
    },
    { staking: 0, liquidity: 0, lending: 0, governance: 0, spot: 0 },
  );

  const chartData = [
    { name: "Spot", value: totals.spot },
    { name: "Staking", value: totals.staking },
    { name: "Liquidity", value: totals.liquidity },
    { name: "Lending", value: totals.lending },
    { name: "Governance", value: totals.governance },
  ].filter((item) => item.value > 0);

  return (
    <SectionCard title="Exposure Breakdown" description="See how the tracked wallet set is distributed across core protocol functions.">
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="h-72 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={94} paddingAngle={2}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={exposureColors[index % exposureColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ background: "rgba(8,12,28,0.96)", border: "1px solid rgba(53,216,255,0.12)", borderRadius: 16 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: exposureColors[index % exposureColors.length] }} />
                {item.name}
              </div>
              <div className="font-semibold text-white">{formatCurrency(item.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
