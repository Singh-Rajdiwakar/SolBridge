"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import type { TransactionRecord, WalletInsightsResponse } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

export function WalletInsights({
  insights,
  transactions,
  loading,
}: {
  insights?: WalletInsightsResponse;
  transactions: TransactionRecord[];
  loading?: boolean;
}) {
  const metrics = useMemo(() => {
    if (insights) {
      return {
        monthlyTransactions: insights.transactionCount,
        totalSent: insights.totalSent,
        totalReceived: insights.totalReceived,
        favoriteToken: insights.favoriteToken,
        averageTxSize: insights.averageTxSize,
        gasSpent: insights.gasSpent,
        activityScore: insights.activityScore,
      };
    }

    const totalSent = transactions
      .filter((tx) => tx.type.includes("Sent"))
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalReceived = transactions
      .filter((tx) => tx.type.includes("Received") || tx.type.includes("Airdrop"))
      .reduce((sum, tx) => sum + tx.amount, 0);
    const favoriteToken =
      Object.entries(
        transactions.reduce<Record<string, number>>((acc, tx) => {
          acc[tx.token] = (acc[tx.token] || 0) + 1;
          return acc;
        }, {}),
      ).sort((a, b) => b[1] - a[1])[0]?.[0] || "SOL";
    const averageTxSize = transactions.length
      ? transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length
      : 0;
    const gasSpent = transactions.length * 0.000005;
    const activityScore = Math.min(98, 42 + transactions.length * 7);

    return {
      monthlyTransactions: transactions.length,
      totalSent,
      totalReceived,
      favoriteToken,
      averageTxSize,
      gasSpent,
      activityScore,
    };
  }, [insights, transactions]);

  const chartData = useMemo(
    () =>
      ["W1", "W2", "W3", "W4"].map((label, index) => ({
        label,
        value: transactions.slice(index * 2, index * 2 + 2).length * 2 + index + 1,
      })),
    [transactions],
  );

  return (
    <GlassCard className="h-full">
      <SectionHeader
        title="Wallet Insights"
        subtitle="Operational activity and transaction behavior metrics for the active wallet."
      />

      {loading ? <LoadingSkeleton type="chart" /> : null}

      {!loading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Monthly Transactions" value={String(metrics.monthlyTransactions)} />
            <Metric label="Total Sent" value={formatNumber(metrics.totalSent, 4)} />
            <Metric label="Total Received" value={formatNumber(metrics.totalReceived, 4)} />
            <Metric label="Favorite Token" value={metrics.favoriteToken} />
            <Metric label="Average Tx Size" value={formatNumber(metrics.averageTxSize, 4)} />
            <Metric label="Gas Spent" value={`${formatNumber(metrics.gasSpent, 6)} SOL`} />
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Activity Score</div>
                <div className="mt-2 text-3xl font-semibold text-white">{metrics.activityScore}</div>
              </div>
              <div className="text-right text-sm text-slate-400">{formatCurrency(metrics.totalReceived * 152.4)}</div>
            </div>

            <div className="mt-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6E7FA3", fontSize: 11 }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Tooltip
                    formatter={(value: number) => `${value} tx`}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgba(120,170,255,0.14)",
                      background: "rgba(10,16,32,0.96)",
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </GlassCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
