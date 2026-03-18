"use client";

import { Info } from "lucide-react";

import { EmptyState, GlassCard, SectionHeader } from "@/components/shared";
import type { AssistantExplanationRecord } from "@/types";

export function InsightExplanationCard({ items }: { items: AssistantExplanationRecord[] }) {
  return (
    <GlassCard className="h-full">
      <SectionHeader
        title="Why These Insights?"
        subtitle="Explainability layer that ties recommendations back to concrete portfolio and risk signals."
        action={<Info className="h-4 w-4 text-cyan-300" />}
      />
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">{item.question}</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{item.answer}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                <span>{item.sourceMetric}</span>
                <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-slate-300">{item.sourceValue}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No explainability signals yet" description="Assistant explanations will appear once enough portfolio data is available." />
      )}
    </GlassCard>
  );
}
