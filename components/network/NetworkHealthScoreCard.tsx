"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import type { NetworkHealthResponse } from "@/types";

const STATUS_ICON = {
  healthy: CheckCircle2,
  moderate: ShieldCheck,
  degraded: AlertTriangle,
  unstable: AlertTriangle,
};

export function NetworkHealthScoreCard({ data }: { data?: NetworkHealthResponse }) {
  const StatusIcon = STATUS_ICON[(data?.status || "moderate") as keyof typeof STATUS_ICON] || ShieldCheck;

  return (
    <GlassCard>
      <SectionHeader
        title="Network Health Score"
        subtitle="Weighted Solana health signal combining throughput, confirmation stability, RPC latency, fees, and validator count."
        action={
          <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-300">
            <StatusIcon className="h-4 w-4 text-cyan-300" />
            {data?.label || "Loading"}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Health Score</div>
          <div className="mt-4 text-5xl font-semibold text-white">{Math.round(data?.score || 0)}</div>
          <div className="mt-3 text-sm text-slate-400">{data?.protocolImpact.summary || "Evaluating network readiness."}</div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(Math.min(data?.score || 0, 100), 0)}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full ${
                (data?.score || 0) >= 82
                  ? "bg-emerald-400"
                  : (data?.score || 0) >= 64
                    ? "bg-cyan-400"
                    : (data?.score || 0) >= 44
                      ? "bg-amber-400"
                      : "bg-rose-400"
              }`}
            />
          </div>
          <div className="mt-3 text-sm text-slate-400">
            Primary issue: <span className="text-white">{data?.primaryIssue?.label || "Pending"}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Best Recent Latency</div>
              <div className="mt-2 text-lg font-semibold text-white">{Math.round(data?.bestRecentLatency || 0)} ms</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Worst Recent Latency</div>
              <div className="mt-2 text-lg font-semibold text-white">{Math.round(data?.worstRecentLatency || 0)} ms</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data?.breakdown?.map((item) => (
            <div key={item.key} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-sm text-slate-400">{Math.round(item.score)}/100</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(Math.min(item.score, 100), 0)}%` }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data?.thresholdWarnings?.length ? (
        <div className="mt-5 space-y-2 rounded-lg border border-amber-400/12 bg-amber-500/8 p-4">
          {data.thresholdWarnings.map((warning) => (
            <div key={warning} className="text-sm text-amber-100">
              {warning}
            </div>
          ))}
        </div>
      ) : null}
    </GlassCard>
  );
}
