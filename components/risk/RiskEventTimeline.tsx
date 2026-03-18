"use client";

import { Clock3 } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskEventsResponse } from "@/types";
import { formatRelativeTime } from "@/utils/format";

export function RiskEventTimeline({ data }: { data?: RiskEventsResponse }) {
  return (
    <SectionCard
      title="Risk Event Timeline"
      description="Major borrow, liquidity, movement, and drawdown events that changed portfolio risk posture."
      action={<Clock3 className="h-4 w-4 text-cyan-300" />}
    >
      {data?.events?.length ? (
        <div className="space-y-3">
          {data.events.map((event) => (
            <div key={event.id} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className={`mt-1 h-2.5 w-2.5 rounded-full ${event.severity === "high" ? "bg-rose-400" : event.severity === "medium" ? "bg-amber-400" : "bg-cyan-300"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-white">{event.description}</div>
                  {event.relatedAsset ? (
                    <div className="rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      {event.relatedAsset}
                    </div>
                  ) : null}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {event.eventType} • {formatRelativeTime(event.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          No recent risk-driving events detected for this wallet.
        </div>
      )}
    </SectionCard>
  );
}
