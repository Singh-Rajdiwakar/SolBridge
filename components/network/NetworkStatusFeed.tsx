"use client";

import { AlertTriangle, Info, Signal } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import type { NetworkStatusEventRecord } from "@/types";
import { formatDate } from "@/utils/format";

const SEVERITY_STYLES = {
  info: "border-cyan-400/12 bg-cyan-500/8 text-cyan-200",
  warning: "border-amber-400/12 bg-amber-500/8 text-amber-200",
  critical: "border-rose-400/12 bg-rose-500/8 text-rose-200",
};

export function NetworkStatusFeed({ events }: { events: NetworkStatusEventRecord[] }) {
  return (
    <GlassCard>
      <SectionHeader
        title="Real-Time Status Feed"
        subtitle="Rule-based network events generated from recent metric changes and threshold crossings."
        action={<Signal className="h-4 w-4 text-cyan-300" />}
      />
      <div className="space-y-3">
        {events.length ? (
          events.map((event) => (
            <div key={`${event.type}-${event.createdAt}`} className={`rounded-lg border p-4 ${SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.info}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md border border-white/10 bg-black/20 p-2">
                    {event.severity === "info" ? <Info className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{event.title}</div>
                    <div className="mt-1 text-sm text-slate-300">{event.description}</div>
                  </div>
                </div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{formatDate(event.createdAt)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
            No recent network events yet. The status feed will populate when the monitor detects material changes.
          </div>
        )}
      </div>
    </GlassCard>
  );
}
