"use client";

import { History } from "lucide-react";

import { EmptyState, GlassCard, SectionHeader } from "@/components/shared";
import type { AssistantHistoryResponse } from "@/types";

export function AssistantTimeline({ data }: { data?: AssistantHistoryResponse }) {
  return (
    <GlassCard>
      <SectionHeader
        title="Assistant Timeline"
        subtitle="How assistant posture, top opportunity, and main risk changed across recent refreshes."
        action={<History className="h-4 w-4 text-cyan-300" />}
      />
      {data?.items?.length ? (
        <div className="space-y-3">
          {data.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">{item.portfolioStatus}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
                <div>Risk: {item.score}/100</div>
                <div>Diversification: {item.diversificationScore}/100</div>
                <div>Confidence: {item.confidence}%</div>
              </div>
              <div className="mt-3 text-sm text-slate-400">{item.summaryText}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                {item.topOpportunity ? <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-200">{item.topOpportunity}</span> : null}
                {item.topRisk ? <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-amber-200">{item.topRisk}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No assistant history yet" description="Use refresh to persist timeline snapshots and compare how advice changes over time." />
      )}
    </GlassCard>
  );
}
