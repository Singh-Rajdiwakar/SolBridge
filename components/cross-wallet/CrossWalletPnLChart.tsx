"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import type { CrossWalletPnLResponse } from "@/types";
import { formatCompactCurrency, formatCurrency } from "@/utils/format";

const colors = ["#22d3ee", "#3b82f6", "#60a5fa", "#2dd4bf", "#7dd3fc", "#93c5fd"];

export function CrossWalletPnLChart({ data }: { data?: CrossWalletPnLResponse }) {
  if (!data) {
    return (
      <SectionCard title="Cross-Wallet PnL" description="Aggregate portfolio growth and contribution across every tracked wallet.">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Add at least one tracked wallet to render cross-wallet PnL analytics.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Cross-Wallet PnL" description="Trend, wallet-level contribution, and combined asset allocation for the active group.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Current Value" value={formatCompactCurrency(data.totalCurrentValue)} />
            <Metric label="Total PnL" value={formatCompactCurrency(data.totalPnl)} positive={data.totalPnl >= 0} />
            <Metric label="Unrealized" value={formatCompactCurrency(data.unrealizedPnl)} positive={data.unrealizedPnl >= 0} />
          </div>

          <div className="h-72 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Portfolio Growth</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="crossWalletTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="shortLabel" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ background: "rgba(8,12,28,0.96)", border: "1px solid rgba(53,216,255,0.12)", borderRadius: 16 }}
                />
                <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.4} fill="url(#crossWalletTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="h-64 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">PnL by Wallet</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pnlByWallet}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="walletLabel" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ background: "rgba(8,12,28,0.96)", border: "1px solid rgba(53,216,255,0.12)", borderRadius: 16 }}
                />
                <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                  {data.pnlByWallet.map((entry) => (
                    <Cell key={entry.walletAddress} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Combined Asset Allocation</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.assetDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={92}
                  paddingAngle={2}
                  stroke="rgba(10,16,32,0.92)"
                >
                  {data.assetDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ background: "rgba(8,12,28,0.96)", border: "1px solid rgba(53,216,255,0.12)", borderRadius: 16 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {data.assetDistribution.map((token, index) => (
              <div key={token.name} className="flex items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }} />
                  {token.name}
                </div>
                <div className="text-white">{formatCurrency(token.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${positive === undefined ? "text-white" : positive ? "text-emerald-300" : "text-rose-300"}`}>
        {value}
      </div>
    </div>
  );
}
