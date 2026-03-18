"use client";

import { AlertTriangle, ArrowUpCircle, BarChart3, ShieldCheck } from "lucide-react";

import { EmptyState, GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import type { AssistantSummaryResponse } from "@/types";

export function AssistantSummaryCard({
  data,
  loading,
}: {
  data?: AssistantSummaryResponse;
  loading?: boolean;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Assistant Summary"
        subtitle="Compact portfolio health, top opportunity, and main risk from the current wallet posture."
        action={<BarChart3 className="h-4 w-4 text-cyan-300" />}
      />

      {loading ? (
        <LoadingSkeleton type="card" />
      ) : data ? (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-cyan-400/18 bg-cyan-400/8 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Portfolio Status</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="text-3xl font-semibold text-white">{data.portfolioStatus.label}</div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-slate-200">
                {data.portfolioStatus.score}/100 risk
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-slate-200">
                {data.portfolioStatus.confidence}% confidence
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{data.portfolioStatus.summary}</p>
            <p className="mt-4 text-sm text-slate-400">{data.summaryText}</p>
          </div>

          <div className="grid gap-3">
            <Metric
              icon={ArrowUpCircle}
              label="Top Opportunity"
              value={data.topOpportunity?.title || "No opportunity yet"}
              detail={data.topOpportunity?.impact || "Waiting for stronger signals"}
              tone="text-emerald-300"
            />
            <Metric
              icon={AlertTriangle}
              label="Main Risk"
              value={data.topRisk?.title || "No major risk"}
              detail={data.topRisk?.impact || "Risk posture contained"}
              tone="text-amber-300"
            />
            <Metric
              icon={ShieldCheck}
              label="Diversification"
              value={`${data.diversificationStatus.label} (${data.diversificationStatus.score}/100)`}
              detail={data.diversificationStatus.summary}
              tone="text-cyan-200"
            />
            <Metric
              icon={BarChart3}
              label="Top Yield Source"
              value={data.topYieldSource ? `${data.topYieldSource.label} • ${data.topYieldSource.annualRate}%` : "No yield data"}
              detail={data.topYieldSource ? `${data.topYieldSource.contributionPercent.toFixed(1)}% of modeled return` : "Waiting for strategy inputs"}
              tone="text-blue-200"
            />
          </div>
        </div>
      ) : (
        <EmptyState title="No assistant summary yet" description="Connect a wallet with portfolio data to activate the assistant." />
      )}
    </GlassCard>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <Icon className={`h-3.5 w-3.5 ${tone}`} />
        {label}
      </div>
      <div className={`mt-3 text-lg font-semibold ${tone}`}>{value}</div>
      <div className="mt-2 text-sm text-slate-400">{detail}</div>
    </div>
  );
}
