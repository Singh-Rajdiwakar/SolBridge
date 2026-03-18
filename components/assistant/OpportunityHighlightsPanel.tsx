"use client";

import { Sparkles } from "lucide-react";

import { EmptyState, GlassCard, SectionHeader } from "@/components/shared";
import type { AssistantOpportunityRecord } from "@/types";

export function OpportunityHighlightsPanel({ items }: { items: AssistantOpportunityRecord[] }) {
  return (
    <GlassCard className="h-full">
      <SectionHeader
        title="Opportunity Highlights"
        subtitle="Highest-value ideas detected from current allocation, protocol usage, and trend context."
        action={<Sparkles className="h-4 w-4 text-emerald-300" />}
      />
      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-emerald-400/12 bg-emerald-400/[0.06] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                  {item.badge || item.type}
                </div>
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{item.message}</div>
              <div className="mt-3 text-sm text-emerald-200">{item.impact}</div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">{item.confidence}% confidence</div>
              {item.action ? (
                <a
                  href={item.action.href}
                  className="mt-4 inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:border-emerald-400/30 hover:text-emerald-100"
                >
                  {item.action.label}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No opportunities surfaced" description="The assistant will highlight stronger yield or efficiency opportunities once the portfolio state changes." />
      )}
    </GlassCard>
  );
}
