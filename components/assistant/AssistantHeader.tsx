"use client";

import { BrainCircuit, RefreshCcw, ShieldAlert } from "lucide-react";

import { GlassCard } from "@/components/shared";
import { Button } from "@/components/ui/button";

export function AssistantHeader({
  mode,
  generatedAt,
  summaryText,
  onRefresh,
  refreshing,
}: {
  mode: string;
  generatedAt?: string;
  summaryText?: string;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
            <BrainCircuit className="h-3.5 w-3.5" />
            {mode}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">AI Financial Assistant</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              {summaryText || "Rule-based financial guidance built from portfolio, risk, yield, and protocol exposure signals."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Last Updated</div>
            <div className="mt-1 font-medium text-white">
              {generatedAt ? new Date(generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Waiting"}
            </div>
          </div>
          <Button variant="secondary" onClick={onRefresh} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing" : "Refresh Insights"}
          </Button>
          <div className="inline-flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            <ShieldAlert className="h-3.5 w-3.5" />
            Informational only
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
