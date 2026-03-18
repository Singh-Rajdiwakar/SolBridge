"use client";

import { Lightbulb } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskRecommendationsResponse } from "@/types";

export function RiskRecommendationsPanel({ data }: { data?: RiskRecommendationsResponse }) {
  return (
    <SectionCard
      title="Risk Recommendations"
      description="Actionable portfolio changes tied directly to the detected risk sources."
      action={<Lightbulb className="h-4 w-4 text-cyan-300" />}
    >
      {data?.recommendations?.length ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            Major contributor: <span className="font-medium text-white">{data.majorContributor}</span>. {data.resilienceInsight}
          </div>
          {data.recommendations.map((recommendation) => (
            <div key={recommendation.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">{recommendation.title}</div>
                <div className={`rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${recommendation.severity === "high" ? "bg-rose-500/12 text-rose-300" : recommendation.severity === "medium" ? "bg-amber-500/12 text-amber-300" : "bg-emerald-500/12 text-emerald-300"}`}>
                  {recommendation.severity}
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-300">{recommendation.detail}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Recommendations will appear once a wallet portfolio is available.
        </div>
      )}
    </SectionCard>
  );
}
