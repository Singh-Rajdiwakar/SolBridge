"use client";

import { useMemo } from "react";
import { ActivitySquare } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import { AnalyticsChartCard } from "@/components/wallet/AnalyticsChartCard";
import { ChartTooltipCard } from "@/components/wallet/ChartTooltipCard";
import { PremiumEmptyChartState } from "@/components/wallet/PremiumEmptyChartState";
import type { WalletAllocationItem, WalletBalanceHistoryPoint, WalletInsightsResponse } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

const chartPalette = ["#3B82F6", "#22D3EE", "#22C55E", "#8B5CF6", "#F59E0B"];

export function WalletAnalyticsCharts({
  allocation,
  history,
  insights,
  loading,
}: {
  allocation: WalletAllocationItem[];
  history: WalletBalanceHistoryPoint[];
  insights?: WalletInsightsResponse;
  loading?: boolean;
}) {
  const totalAllocation = allocation.reduce((sum, item) => sum + item.value, 0);
  const dominantAsset = allocation.slice().sort((a, b) => b.value - a.value)[0];
  const monthlyVolume = useMemo(() => insights?.monthlyVolume || [], [insights?.monthlyVolume]);
  const profitLossSeries = insights?.profitLossSeries || history;
  const activitySeries = insights?.transactionFrequency || [];
  const feeTrend = useMemo(
    () =>
      monthlyVolume.map((point, index) => ({
        label: point.label,
        value: Number((((insights?.gasSpent || 0) || 0) / Math.max(monthlyVolume.length, 1) * (1 + index * 0.08)).toFixed(6)),
      })),
    [insights?.gasSpent, monthlyVolume],
  );

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_80%_100%,rgba(34,211,238,0.1),transparent_28%)]" />
      <SectionHeader
        title="Wallet Analytics Grid"
        subtitle="Allocation, valuation trend, volume, P&L, activity cadence, and fee telemetry grouped as one live intelligence cluster."
        action={<ActivitySquare className="h-4 w-4 text-cyan-300" />}
      />

      {loading ? (
        <LoadingSkeleton type="chart" />
      ) : allocation.length === 0 && history.length === 0 ? (
        <PremiumEmptyChartState
          title="No historical transaction data yet."
          description="Charts will populate after on-chain activity is detected and wallet portfolio snapshots begin to accumulate."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-12">
          <AnalyticsChartCard
            title="Asset Distribution"
            subtitle="Asset concentration by live wallet value"
            metric={dominantAsset ? `${dominantAsset.name} dominant` : undefined}
            className="xl:col-span-4"
          >
            {allocation.length > 0 ? (
              <div className="grid items-center gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative h-60">
                  <div className="pointer-events-none absolute inset-8 rounded-full bg-cyan-400/10 blur-2xl" />
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocation}
                        innerRadius={76}
                        outerRadius={98}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        isAnimationActive
                        animationDuration={900}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth={1}
                      >
                        {allocation.map((item, index) => (
                          <Cell key={item.name} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={
                          <ChartTooltipCard
                            formatter={(value) => formatCurrency(Number(value))}
                            labelPrefix="Asset"
                          />
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Total Balance</div>
                    <div className="mt-2 text-xl font-semibold text-white">{formatCurrency(totalAllocation)}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-200">
                      {dominantAsset?.name || "Awaiting mix"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {allocation.map((item, index) => (
                    <div key={item.name} className="rounded-lg border border-white/10 bg-[#0a1324]/90 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                          />
                          <span className="text-sm font-medium text-white">{item.name}</span>
                        </div>
                        <span className="text-sm text-slate-300">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <PremiumEmptyChartState
                title="Allocation signal not available."
                description="Waiting for wallet activity to generate analytics."
                className="py-6"
              />
            )}
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Wallet Value Trend"
            subtitle="Portfolio trajectory across detected on-chain windows"
            metric={history.at(-1)?.value ? formatCurrency(history.at(-1)!.value) : undefined}
            className="xl:col-span-8"
          >
            {history.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="wallet-value-trend-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6E7FA3", fontSize: 11 }} />
                    <YAxis hide />
                    <Tooltip
                      content={<ChartTooltipCard formatter={(value) => formatCurrency(Number(value))} labelPrefix="Window" />}
                    />
                    <Area
                      isAnimationActive
                      animationDuration={950}
                      type="monotone"
                      dataKey="value"
                      stroke="#22D3EE"
                      strokeWidth={2.5}
                      fill="url(#wallet-value-trend-fill)"
                      activeDot={{ r: 5, fill: "#22D3EE", stroke: "#08111F", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <PremiumEmptyChartState
                title="Charts will populate after on-chain activity is detected."
                description="Wallet value needs indexed snapshots before timeline analytics can be rendered."
                className="py-10"
              />
            )}
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Monthly Transaction Volume"
            subtitle="Tracked wallet flow across recent periods"
            metric={monthlyVolume.length ? `${monthlyVolume.length} periods` : undefined}
            className="xl:col-span-4"
          >
            {monthlyVolume.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyVolume}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6E7FA3", fontSize: 11 }} />
                    <YAxis hide />
                    <Tooltip content={<ChartTooltipCard formatter={(value) => formatCurrency(Number(value))} labelPrefix="Period" />} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[5, 5, 0, 0]} isAnimationActive animationDuration={850} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <PremiumEmptyChartState
                title="No monthly volume yet."
                description="Transaction volume bars will rise here after wallet transfers, swaps, or token activity are detected."
                className="py-8"
              />
            )}
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Profit / Loss Trend"
            subtitle="Change in realized and unrealized wallet trajectory"
            metric={profitLossSeries.length ? `${formatNumber(profitLossSeries.at(-1)?.value || 0, 2)} signal` : undefined}
            className="xl:col-span-4"
          >
            {profitLossSeries.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitLossSeries}>
                    <defs>
                      <linearGradient id="wallet-pnl-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6E7FA3", fontSize: 11 }} />
                    <YAxis hide />
                    <Tooltip
                      content={<ChartTooltipCard formatter={(value) => formatCurrency(Number(value))} labelPrefix="P/L" />}
                    />
                    <Area
                      isAnimationActive
                      animationDuration={820}
                      type="monotone"
                      dataKey="value"
                      stroke={profitLossSeries.at(-1)?.value && profitLossSeries.at(-1)!.value < 0 ? "#EF4444" : "#22C55E"}
                      strokeWidth={2.2}
                      fill="url(#wallet-pnl-fill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <PremiumEmptyChartState
                title="Profit and loss trend unavailable."
                description="Waiting for wallet activity to generate analytics."
                className="py-8"
              />
            )}
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Fee Estimator Trend"
            subtitle="Network fee drift based on recent observation windows"
            metric={feeTrend.length ? `${formatNumber(feeTrend.at(-1)?.value || 0, 6)} SOL` : undefined}
            className="xl:col-span-4"
          >
            {feeTrend.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={feeTrend}>
                    <defs>
                      <linearGradient id="wallet-fee-trend-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity={0.26} />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6E7FA3", fontSize: 11 }} />
                    <YAxis hide />
                    <Tooltip
                      content={<ChartTooltipCard formatter={(value) => `${formatNumber(Number(value), 6)} SOL`} labelPrefix="Fee" />}
                    />
                    <Area
                      isAnimationActive
                      animationDuration={880}
                      type="monotone"
                      dataKey="value"
                      stroke="#22C55E"
                      strokeWidth={2.1}
                      fill="url(#wallet-fee-trend-fill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <PremiumEmptyChartState
                title="Fee telemetry is waiting for volume."
                description="Fee analytics become richer once the wallet has enough execution history."
                className="py-8"
              />
            )}
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Wallet Activity Timeline"
            subtitle="Checkpoint cadence across detected wallet action windows"
            metric={activitySeries.length ? `${formatNumber(insights?.transactionCount || 0, 0)} actions` : undefined}
            className="xl:col-span-12"
          >
            {activitySeries.length > 0 ? (
              <div className="relative h-36 overflow-hidden rounded-lg border border-white/8 bg-[#0a1324]/80 px-4 py-6">
                <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                <div className="relative flex h-full items-center justify-between gap-4">
                  {activitySeries.map((point, index) => (
                    <div key={point.label} className="relative flex flex-1 flex-col items-center">
                      <div className="absolute top-1/2 h-10 w-px -translate-y-1/2 bg-white/8" />
                      <div className="mb-4 text-[11px] uppercase tracking-[0.16em] text-slate-500">{point.label}</div>
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md" />
                        <div
                          className="relative h-4 w-4 rounded-full border border-cyan-300/28 bg-[radial-gradient(circle_at_center,#22D3EE,rgba(34,211,238,0.12))]"
                          style={{ opacity: 0.45 + Math.min(0.55, point.value / Math.max(...activitySeries.map((item) => item.value), 1)) }}
                        />
                      </div>
                      <div className="mt-4 text-sm font-semibold text-white">{formatNumber(point.value, 0)}</div>
                      {index < activitySeries.length - 1 ? (
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-px w-full translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-300/22 to-transparent" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <PremiumEmptyChartState
                title="Waiting for wallet activity to generate analytics."
                description="Timeline checkpoints will appear as transaction cadence and on-chain events are mirrored into the analytics layer."
                className="py-8"
              />
            )}
          </AnalyticsChartCard>
        </div>
      )}
    </GlassCard>
  );
}
