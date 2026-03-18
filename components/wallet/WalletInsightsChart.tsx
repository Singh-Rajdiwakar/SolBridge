"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import type { WalletInsightsResponse } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

export function WalletInsightsChart({
  insights,
  loading,
}: {
  insights?: WalletInsightsResponse;
  loading?: boolean;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Wallet Activity Analytics"
        subtitle="Transaction cadence, monthly flow, and profit trajectory."
      />

      {loading || !insights ? (
        <LoadingSkeleton type="chart" />
      ) : (
        <div className="space-y-4">
          <ChartBlock
            title="Transaction Frequency"
            subtitle="Recent transaction cadence"
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.transactionFrequency || []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6E7FA3", fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip formatter={(value: number) => `${value} tx`} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            }
          />

          <ChartBlock
            title="Monthly Volume"
            subtitle="Tracked wallet volume"
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insights.monthlyVolume || []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6E7FA3", fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            }
          />

          <ChartBlock
            title="Profit / Loss"
            subtitle={`Average tx size ${formatNumber(insights.averageTxSize, 4)}`}
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insights.profitLossSeries || []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6E7FA3", fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            }
          />
        </div>
      )}
    </GlassCard>
  );
}

function ChartBlock({
  title,
  subtitle,
  chart,
}: {
  title: string;
  subtitle: string;
  chart: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{subtitle}</div>
        </div>
      </div>
      <div className="mt-3 h-32">{chart}</div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid rgba(120,170,255,0.14)",
  background: "rgba(10,16,32,0.96)",
};
