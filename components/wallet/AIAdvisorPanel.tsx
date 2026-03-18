"use client";

import { BrainCircuit, Sparkles } from "lucide-react";

import { EmptyState, GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import type { AiPortfolioAdviceResponse } from "@/types";
import { formatNumber } from "@/utils/format";

export function AIAdvisorPanel({
  advice,
  loading,
}: {
  advice?: AiPortfolioAdviceResponse;
  loading?: boolean;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="AI Portfolio Advisor"
        subtitle="Allocation guidance, diversification posture, and next-step recommendations."
        action={<BrainCircuit className="h-4 w-4 text-cyan-300" />}
      />

      {loading ? (
        <LoadingSkeleton type="card" />
      ) : advice ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-cyan-400/16 bg-cyan-400/8 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">AI Portfolio Insight</div>
                <div className="mt-2 text-xl font-semibold text-white">{advice.riskLevel} Allocation Risk</div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                {advice.confidence}% confidence
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Metric label="Dominant Asset" value={advice.dominantAsset} />
              <Metric label="Diversification" value={`${advice.diversificationScore}/100`} />
              <Metric label="Dominant Allocation" value={`${formatNumber(advice.dominantAllocation, 1)}%`} />
              <Metric label="Stablecoin Share" value={`${formatNumber(advice.stablecoinShare, 1)}%`} />
            </div>
          </div>

          <div className="space-y-3">
            {advice.recommendations.map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Portfolio Insights</div>
            <div className="mt-3 space-y-2">
              {advice.portfolioInsights.map((item) => (
                <div key={item} className="text-sm leading-6 text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No AI advice yet"
          description="Retix AI will generate allocation guidance once portfolio data is available."
        />
      )}
    </GlassCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#0b1324] p-3">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
