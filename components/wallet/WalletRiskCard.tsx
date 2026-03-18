"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";

import { GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import type { WalletRiskScoreResponse } from "@/types";
import { cn } from "@/utils/cn";

function scoreTone(score: number) {
  if (score >= 90) {
    return "text-emerald-300";
  }
  if (score >= 70) {
    return "text-cyan-200";
  }
  if (score >= 40) {
    return "text-amber-200";
  }
  return "text-rose-300";
}

function levelIcon(level?: string) {
  if (level === "Very Safe" || level === "Safe") {
    return <ShieldCheck className="h-4 w-4 text-emerald-300" />;
  }
  return <ShieldAlert className="h-4 w-4 text-rose-300" />;
}

export function WalletRiskCard({
  score,
  loading,
}: {
  score?: WalletRiskScoreResponse;
  loading?: boolean;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Wallet Risk Score"
        subtitle="Security posture across transaction patterns, failed sends, and suspicious interactions."
        action={levelIcon(score?.riskLevel)}
      />

      {loading || !score ? (
        <LoadingSkeleton type="card" />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Security Rating</div>
                <div className={cn("mt-2 text-4xl font-semibold", scoreTone(score.score))}>
                  {score.score}
                  <span className="ml-2 text-lg text-slate-500">/100</span>
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                {score.riskLevel}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
              <div
                className={cn(
                  "h-full rounded-full",
                  score.score >= 90
                    ? "bg-emerald-400"
                    : score.score >= 70
                      ? "bg-cyan-400"
                      : score.score >= 40
                        ? "bg-amber-400"
                        : "bg-rose-400",
                )}
                style={{ width: `${score.score}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Suspicious Interactions" value={String(score.metrics.suspiciousInteractions)} />
            <Metric label="Failed Transactions" value={String(score.metrics.failedTransactions)} />
            <Metric label="Wallet Age" value={`${score.metrics.walletAgeDays}d`} />
            <Metric label="Consistency" value={`${score.metrics.transactionConsistency}%`} />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Improvement Suggestions</div>
            <div className="mt-3 space-y-2">
              {score.recommendations.map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-[#0b1324] px-3 py-3 text-sm leading-6 text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
