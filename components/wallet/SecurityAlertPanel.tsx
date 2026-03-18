"use client";

import { AlertTriangle, ShieldCheck, Siren } from "lucide-react";

import { EmptyState, GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import type { SecurityAlert } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";

const toneMap: Record<string, string> = {
  success: "border-emerald-400/18 bg-emerald-500/10 text-emerald-200",
  info: "border-cyan-400/18 bg-cyan-400/10 text-cyan-100",
  caution: "border-amber-400/18 bg-amber-500/10 text-amber-100",
  warning: "border-amber-400/18 bg-amber-500/10 text-amber-100",
  danger: "border-rose-400/18 bg-rose-500/10 text-rose-100",
};

function AlertIcon({ severity }: { severity: string }) {
  if (severity === "success") {
    return <ShieldCheck className="h-4 w-4" />;
  }
  if (severity === "danger") {
    return <Siren className="h-4 w-4" />;
  }
  return <AlertTriangle className="h-4 w-4" />;
}

export function SecurityAlertPanel({
  alerts,
  loading,
}: {
  alerts: SecurityAlert[];
  loading?: boolean;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Security Alerts"
        subtitle="AI-screened warnings, congestion notices, and wallet protection signals."
        action={
          <div className="inline-flex items-center gap-2 rounded-md border border-cyan-400/16 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            Live
          </div>
        }
      />

      {loading ? (
        <LoadingSkeleton type="list" />
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-lg border p-4",
                toneMap[alert.severity] || toneMap.info,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{<AlertIcon severity={alert.severity} />}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{alert.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-200/80">
                      {alert.description}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-300/70">
                      {alert.source}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-slate-300/70">
                  {formatDate(alert.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No active alerts"
          description="Retix AI is not seeing any material risks or network concerns right now."
        />
      )}
    </GlassCard>
  );
}
