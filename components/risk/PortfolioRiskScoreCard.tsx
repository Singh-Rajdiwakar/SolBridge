"use client";

import type { ReactNode } from "react";
import { ShieldAlert, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskSummaryResponse } from "@/types";

function toneForScore(score: number) {
  if (score <= 35) return "from-emerald-400 to-cyan-300";
  if (score <= 65) return "from-amber-400 to-yellow-300";
  return "from-rose-400 to-orange-300";
}

export function PortfolioRiskScoreCard({
  data,
  loading,
}: {
  data?: RiskSummaryResponse;
  loading?: boolean;
}) {
  if (loading || !data) {
    return (
      <SectionCard
        title="Portfolio Risk Score"
        description="Unified score across volatility, borrow exposure, liquidity activity, and concentration."
      >
        <div className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
      </SectionCard>
    );
  }

  const safe = data.totalRiskScore <= data.thresholds.lowRiskMax;

  return (
    <SectionCard
      title="Portfolio Risk Score"
      description="Single score engineered from the strongest protocol and portfolio risk drivers."
      action={safe ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <ShieldAlert className="h-4 w-4 text-amber-300" />}
    >
      <div className="grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current Score</div>
          <div className="mt-4 flex items-end gap-3">
            <div className="text-5xl font-semibold text-white">{data.totalRiskScore}</div>
            <div className="pb-2 text-sm text-slate-500">/ 100</div>
          </div>
          <div className="mt-2 text-sm font-medium text-slate-300">{data.riskLabel}</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${toneForScore(data.totalRiskScore)}`}
              style={{ width: `${data.totalRiskScore}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="Major Driver" value={data.majorContributor} />
            <Metric
              label="Trend"
              value={data.trendDirection}
              accent={
                data.trendDirection.includes("improving")
                  ? <TrendingDown className="h-4 w-4 text-emerald-300" />
                  : <TrendingUp className="h-4 w-4 text-amber-300" />
              }
            />
            <Metric label="Health Factor" value={data.borrowMetrics.healthFactor?.toFixed(2) || "--"} />
            <Metric label="Debt Ratio" value={`${data.borrowMetrics.debtToCollateralRatio}%`} />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">What Changed</div>
            <div className="mt-2 text-base font-medium text-white">{data.whatChangedThisWeek}</div>
            <div className="mt-2 text-sm text-slate-400">{data.explanationSummary}</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            {data.resilienceInsight}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Threshold label="Low Risk" value={`0 - ${data.thresholds.lowRiskMax}`} tone="text-emerald-300" />
            <Threshold label="Moderate" value={`${data.thresholds.lowRiskMax + 1} - ${data.thresholds.moderateRiskMax}`} tone="text-amber-300" />
            <Threshold label="High Risk" value={`${data.thresholds.moderateRiskMax + 1} - ${data.thresholds.highRiskMax}`} tone="text-orange-300" />
            <Threshold label="Critical" value={`${data.thresholds.criticalRiskMin}+`} tone="text-rose-300" />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <span>{label}</span>
        {accent}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function Threshold({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-2 text-sm font-medium ${tone}`}>{value}</div>
    </div>
  );
}
