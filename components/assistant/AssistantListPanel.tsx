"use client";

import type { LucideIcon } from "lucide-react";

import { EmptyState, GlassCard, SectionHeader } from "@/components/shared";
import type { AssistantInsightRecord } from "@/types";

export function AssistantListPanel({
  title,
  subtitle,
  icon: Icon,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  items: AssistantInsightRecord[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <GlassCard className="h-full">
      <SectionHeader title={title} subtitle={subtitle} action={<Icon className="h-4 w-4 text-cyan-300" />} />
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{item.message}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                    {item.severity}
                  </span>
                  <span className="rounded-md border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                    {item.confidence}% confidence
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-400">
                {item.why ? <div><span className="text-slate-500">Why:</span> {item.why}</div> : null}
                {item.trigger ? <div><span className="text-slate-500">Signal:</span> {item.trigger}</div> : null}
                {item.impact ? <div><span className="text-slate-500">Impact:</span> {item.impact}</div> : null}
              </div>

              {item.action ? (
                <a
                  href={item.action.href}
                  className="mt-4 inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:border-cyan-400/30 hover:text-cyan-100"
                >
                  {item.action.label}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </GlassCard>
  );
}
