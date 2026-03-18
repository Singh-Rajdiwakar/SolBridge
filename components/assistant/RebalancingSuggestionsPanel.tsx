"use client";

import { SlidersHorizontal } from "lucide-react";

import { EmptyState, GlassCard, SectionHeader } from "@/components/shared";
import type { AssistantRebalancingRecord } from "@/types";

export function RebalancingSuggestionsPanel({ items }: { items: AssistantRebalancingRecord[] }) {
  return (
    <GlassCard className="h-full">
      <SectionHeader
        title="Rebalancing Suggestions"
        subtitle="Bucket-level changes that improve balance between yield, concentration, and resilience."
        action={<SlidersHorizontal className="h-4 w-4 text-cyan-300" />}
      />
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <div className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                  Target {item.targetAllocation.toFixed(1)}%
                </div>
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{item.message}</div>
              <div className="mt-3 grid gap-2 text-sm text-slate-400">
                <div><span className="text-slate-500">Reason:</span> {item.reason}</div>
                <div><span className="text-slate-500">Risk impact:</span> {item.expectedRiskImpact >= 0 ? "+" : ""}{item.expectedRiskImpact.toFixed(1)} pts</div>
                <div><span className="text-slate-500">Yield impact:</span> {item.expectedYieldImpact >= 0 ? "+" : ""}{item.expectedYieldImpact.toFixed(2)}%</div>
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
        <EmptyState title="No rebalance needed" description="The current wallet mix is close to the assistant's preferred allocation bands." />
      )}
    </GlassCard>
  );
}
