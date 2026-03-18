"use client";

import { useMemo, useState } from "react";
import { Activity, Coins, PieChart as PieChartIcon } from "lucide-react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { EmptyState, GlassCard, LoadingSkeleton, SearchBar, SectionHeader, TokenBadge } from "@/components/shared";
import type { WalletAllocationItem, WalletBalanceHistoryPoint, WalletTokenBalance } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

const allocationColors = ["#3B82F6", "#22D3EE", "#60A5FA", "#38BDF8", "#93C5FD"];

export function TokenPortfolio({
  tokens,
  allocation,
  history,
  loading,
}: {
  tokens: WalletTokenBalance[];
  allocation: WalletAllocationItem[];
  history: WalletBalanceHistoryPoint[];
  loading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filteredTokens = useMemo(
    () => tokens.filter((token) => token.symbol.toLowerCase().includes(query.trim().toLowerCase())),
    [query, tokens],
  );

  return (
    <GlassCard>
      <SectionHeader
        title="Token Portfolio"
        subtitle="Tracked assets, allocation, and wallet balance history."
        action={<Coins className="h-4 w-4 text-cyan-300" />}
      />

      {loading ? (
        <LoadingSkeleton type="chart" />
      ) : tokens.length > 0 ? (
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Allocation</div>
                  <div className="mt-1 text-sm text-slate-300">Portfolio weight by USD value</div>
                </div>
                <PieChartIcon className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={84}
                      paddingAngle={2}
                      stroke="rgba(10,16,32,0.9)"
                    >
                      {allocation.map((entry, index) => (
                        <Cell key={entry.name} fill={allocationColors[index % allocationColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid rgba(120,170,255,0.16)",
                        background: "rgba(10,16,32,0.96)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid gap-2">
                {allocation.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: allocationColors[index % allocationColors.length] }}
                      />
                      {entry.name}
                    </div>
                    <div className="text-white">{formatCurrency(entry.value)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Balance History</div>
                  <div className="mt-1 text-sm text-slate-300">7-day wallet value trend</div>
                </div>
                <Activity className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <defs>
                      <linearGradient id="wallet-history" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#22D3EE" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                    <Line type="monotone" dataKey="value" stroke="url(#wallet-history)" strokeWidth={2.5} dot={false} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid rgba(120,170,255,0.16)",
                        background: "rgba(10,16,32,0.96)",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Token Holdings</div>
                <div className="text-sm text-slate-400">Search by symbol and review current balances</div>
              </div>
              <div className="w-full max-w-xs">
                <SearchBar value={query} onChange={setQuery} placeholder="Search token symbol" />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/10">
              <div className="grid grid-cols-[1.1fr_0.7fr_0.7fr_0.55fr] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                <div>Token</div>
                <div>Balance</div>
                <div>USD Value</div>
                <div>24h</div>
              </div>
              {filteredTokens.map((token) => (
                <div
                  key={token.symbol}
                  className="grid grid-cols-[1.1fr_0.7fr_0.7fr_0.55fr] gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <TokenBadge symbol={token.symbol} />
                  </div>
                  <div className="text-sm font-medium text-white">{formatNumber(token.balance, 4)}</div>
                  <div className="text-sm font-medium text-white">{formatCurrency(token.usdValue)}</div>
                  <div
                    className={`inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-xs ${
                      token.change >= 0
                        ? "border-emerald-400/15 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-400/15 bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {token.change >= 0 ? "+" : ""}
                    {formatNumber(token.change, 2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState title="No token balances" description="Connect a wallet or mint a token to populate the portfolio." />
      )}
    </GlassCard>
  );
}
