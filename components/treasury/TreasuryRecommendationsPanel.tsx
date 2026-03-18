import { Lightbulb } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { TreasuryHealthResponse, TreasuryOverviewResponse } from "@/types";

export function TreasuryRecommendationsPanel({
  overview,
  health,
}: {
  overview?: TreasuryOverviewResponse;
  health?: TreasuryHealthResponse;
}) {
  const recommendations = health?.recommendations || [];

  return (
    <SectionCard title="Treasury Allocation Recommendations" description="Rule-based treasury guidance connected to reserve concentration and runway posture.">
      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <div key={recommendation.title} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 p-2">
                <Lightbulb className="h-4 w-4 text-cyan-200" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium text-white">{recommendation.title}</div>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    {recommendation.priority}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{recommendation.detail}</p>
              </div>
            </div>
          </div>
        ))}
        {overview?.insights?.length ? (
          <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Category insights</div>
            <div className="mt-2 space-y-2 text-sm text-slate-300">
              {overview.insights.map((insight) => (
                <div key={insight}>{insight}</div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
