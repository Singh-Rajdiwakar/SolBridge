"use client";

import { ShieldAlert } from "lucide-react";

import { GlassCard } from "@/components/shared";
import type { StrategySimulationResponse } from "@/types";

function tone(score?: number) {
  if (!score && score !== 0) return "bg-white/10";
  if (score <= 35) return "bg-emerald-400";
  if (score <= 55) return "bg-cyan-400";
  if (score <= 78) return "bg-amber-400";
  return "bg-rose-400";
}

export function RiskScoreCard({
  data,
  loading,
}: {
  data?: StrategySimulationResponse;
  loading?: boolean;
}) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />;
  }

  const score = data?.risk.score || 0;

  return (
    <GlassCard className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Risk Score</div>
          <div className="mt-3 text-3xl font-semibold text-white">{data ? `${score}/100` : "--"}</div>
          <div className="mt-2 text-sm text-slate-400">{data?.risk.label || "Risk band unavailable"}</div>
        </div>
        <div className="rounded-md border border-amber-400/20 bg-amber-400/10 p-2 text-amber-200">
          <ShieldAlert className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 h-2 rounded-full bg-white/8">
        <div className={`h-2 rounded-full ${tone(score)}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Primary Driver</div>
          <div className="mt-2 text-base font-semibold text-white">{data?.explainability.highestRiskBucket || "--"}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Stable Buffer</div>
          <div className="mt-2 text-base font-semibold text-white">
            {data ? `${data.risk.stableReserveBuffer.toFixed(1)}%` : "--"}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm leading-6 text-slate-400">
        {data?.risk.explanation || "Risk explanation appears after a valid strategy simulation."}
      </div>
    </GlassCard>
  );
}
