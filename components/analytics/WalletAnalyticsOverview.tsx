"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import {
  NetworkPerformanceCard,
  PortfolioAllocationChart,
  TransactionHistory,
  WalletInsights,
  WalletInsightsChart,
  WalletTicker,
} from "@/components/wallet";
import { useWalletData } from "@/hooks/use-wallet-data";
import { DEFAULT_SOL_FEE } from "@/lib/solana";
import { analyticsApi, portfolioApi } from "@/services/api";
import { formatCurrency, formatNumber } from "@/utils/format";

function buildHeatmap(transactions: Array<{ createdAt: string }>) {
  const today = new Date();
  const cells: Array<{ key: string; count: number; label: string }> = [];
  for (let week = 3; week >= 0; week -= 1) {
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - week * 7 - (6 - day));
      const key = date.toISOString().slice(0, 10);
      const count = transactions.filter((transaction) => transaction.createdAt.slice(0, 10) === key).length;
      cells.push({
        key,
        count,
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
  }
  return cells;
}

export function WalletAnalyticsOverview() {
  const {
    connected,
    authUser,
    address,
    portfolioQuery,
    portfolioTokens,
    balanceHistory,
    insightsQuery,
    transactions,
    gasOptimizationQuery,
    latencyMs,
    onChainSummary,
    portfolioAdviceQuery,
  } = useWalletData();

  const targetWallet = address || authUser?.walletAddress;

  const walletAnalyticsQuery = useQuery({
    queryKey: ["analytics", "wallet", targetWallet],
    queryFn: () => analyticsApi.wallet(targetWallet!),
    enabled: Boolean(targetWallet),
  });

  const snapshotsQuery = useQuery({
    queryKey: ["portfolio", "snapshots", targetWallet],
    queryFn: () => portfolioApi.snapshots(targetWallet!),
    enabled: Boolean(targetWallet),
  });

  const heatmapCells = useMemo(() => buildHeatmap(transactions), [transactions]);

  const tokenPnlRows = useMemo(
    () =>
      portfolioTokens.map((token) => {
        const currentValue = token.usdValue;
        const previousValue = token.change === -100 ? 0 : currentValue / (1 + token.change / 100);
        const pnl = currentValue - previousValue;
        return {
          ...token,
          previousValue,
          pnl,
        };
      }),
    [portfolioTokens],
  );

  const rebalanceSuggestions = useMemo(() => {
    const allocation = portfolioQuery.data?.allocation || [];
    const total = allocation.reduce((sum, item) => sum + item.value, 0);
    const dominant = allocation.slice().sort((a, b) => b.value - a.value)[0];
    const stablecoin = portfolioTokens.find((token) => token.symbol === "USDC");
    const suggestions: string[] = [];

    if (dominant && total > 0 && dominant.value / total > 0.55) {
      suggestions.push(`Reduce ${dominant.name} concentration by rotating 10-15% into a lower-volatility asset mix.`);
    }
    if ((stablecoin?.usdValue || 0) / Math.max(total, 1) < 0.12) {
      suggestions.push("Increase stablecoin coverage to improve treasury resilience during volatile windows.");
    }
    const weakest = tokenPnlRows.slice().sort((a, b) => a.pnl - b.pnl)[0];
    if (weakest && weakest.pnl < 0) {
      suggestions.push(`Review ${weakest.symbol} position sizing; it is the weakest 24h contributor in the current wallet mix.`);
    }

    return suggestions.length > 0
      ? suggestions
      : ["Current allocation looks balanced for a devnet operator wallet. Keep monitoring inflows and governance exposure."];
  }, [portfolioQuery.data?.allocation, portfolioTokens, tokenPnlRows]);

  const snapshotTrend = useMemo(
    () =>
      (snapshotsQuery.data || []).slice().reverse().map((snapshot) => ({
        label: new Date(snapshot.takenAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: snapshot.totalValue,
        pnl: snapshot.pnl || 0,
      })),
    [snapshotsQuery.data],
  );

  return (
    <div className="space-y-6">
      <WalletTicker transactions={transactions} />

      <SectionCard
        title="On-chain analytics inputs"
        description="These summary metrics are built from live staking, liquidity, lending, and governance account reads before off-chain charts and portfolio analytics are computed."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Staked", formatNumber(onChainSummary.stakingTotal, 4), `${onChainSummary.stakingPositionsCount} positions`],
            ["Pending rewards", formatNumber(onChainSummary.pendingRewards, 4), "Anchor staking accrual"],
            ["LP balance", formatNumber(onChainSummary.totalLpBalance, 4), `${onChainSummary.liquidityPositionsCount} LP positions`],
            ["Borrowed", formatNumber(onChainSummary.borrowedAmount, 4), onChainSummary.healthFactor ? `HF ${formatNumber(onChainSummary.healthFactor, 2)}` : "No debt"],
            ["Governance", formatNumber(onChainSummary.totalGovernanceVotes, 0), `${onChainSummary.activeGovernanceProposals} active proposals`],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
              <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
              <div className="mt-2 text-sm text-slate-400">{detail}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <PortfolioAllocationChart allocation={portfolioQuery.data?.allocation || []} history={balanceHistory} />

        <div className="space-y-6">
          <WalletInsights insights={insightsQuery.data} transactions={transactions} loading={insightsQuery.isLoading && connected} />
          <NetworkPerformanceCard latencyMs={latencyMs} feeEstimate={gasOptimizationQuery.data?.currentFee || DEFAULT_SOL_FEE} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          title="Wallet Activity Heatmap"
          description="A quick cadence map of the last four weeks of wallet interactions."
          action={<Activity className="h-4 w-4 text-cyan-300" />}
        >
          <div className="grid grid-cols-7 gap-2">
            {heatmapCells.map((cell) => (
              <div
                key={cell.key}
                className="group rounded-md border border-white/10 p-2 text-center"
                style={{
                  background:
                    cell.count === 0
                      ? "rgba(255,255,255,0.03)"
                      : `rgba(34,211,238,${Math.min(0.18 + cell.count * 0.14, 0.82)})`,
                }}
                title={`${cell.label}: ${cell.count} transaction${cell.count === 1 ? "" : "s"}`}
              >
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{cell.label.split(" ")[0]}</div>
                <div className="mt-2 text-sm font-semibold text-white">{cell.count}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-slate-400">
            {walletAnalyticsQuery.data
              ? `${formatNumber(walletAnalyticsQuery.data.txCount, 0)} mirrored transactions indexed for this wallet.`
              : "Connect a linked wallet to populate mirror-backed heatmap analytics."}
          </div>
        </SectionCard>

        <SectionCard title="PnL by Token" description="24h contribution by wallet asset using current value and recent token movement.">
          <div className="space-y-3">
            {tokenPnlRows.length > 0 ? tokenPnlRows.map((token) => (
              <div key={token.symbol} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{token.symbol}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      Current {formatCurrency(token.usdValue)} • Previous {formatCurrency(token.previousValue)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${token.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {token.pnl >= 0 ? "+" : ""}{formatCurrency(token.pnl)}
                    </div>
                    <div className={`text-sm ${token.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {token.change >= 0 ? "+" : ""}{formatNumber(token.change, 2)}% 24h
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
                No token balances available yet for PnL breakdown.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Portfolio Snapshot Trend" description="Database-backed portfolio snapshots used for long-window analytics and AI advisory history.">
          {snapshotTrend.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshotTrend}>
                  <defs>
                    <linearGradient id="snapshotTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(8, 12, 28, 0.96)", border: "1px solid rgba(53, 216, 255, 0.12)", borderRadius: "16px" }} />
                  <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.4} fill="url(#snapshotTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
              Portfolio snapshots will appear here once backend snapshot jobs index your linked wallet.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Portfolio Rebalancing Suggestions" description="AI-assisted and rules-based guidance derived from wallet allocation, stablecoin coverage, and token drift.">
          <div className="space-y-3">
            {(portfolioAdviceQuery.data?.recommendations || rebalanceSuggestions).map((suggestion) => (
              <div key={suggestion} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                {suggestion}
              </div>
            ))}
          </div>
          {portfolioAdviceQuery.data ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Risk Level</div>
                <div className="mt-2 text-xl font-semibold text-white">{portfolioAdviceQuery.data.riskLevel}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Diversification</div>
                <div className="mt-2 text-xl font-semibold text-white">{formatNumber(portfolioAdviceQuery.data.diversificationScore, 0)} / 100</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Dominant Asset</div>
                <div className="mt-2 text-xl font-semibold text-white">{portfolioAdviceQuery.data.dominantAsset}</div>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard title="Monthly Volume and Profitability" description="Operator-friendly snapshot of wallet throughput and estimated profitability drift.">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insightsQuery.data?.monthlyVolume || []}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgba(8, 12, 28, 0.96)", border: "1px solid rgba(53, 216, 255, 0.12)", borderRadius: "16px" }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <WalletInsightsChart insights={insightsQuery.data} loading={insightsQuery.isLoading && connected} />
        </div>
      </SectionCard>

      <TransactionHistory transactions={transactions} loading={false} />
    </div>
  );
}
