"use client";

import type { ReactNode } from "react";
import { Activity, GaugeCircle, ShieldCheck, TimerReset } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import { LiveStatusBadge } from "@/components/wallet/LiveStatusBadge";
import { formatNumber } from "@/utils/format";

export function NetworkHealthPanel({
  latencyMs,
  feeEstimate,
  networkHealth,
  transactionSpeed,
  congestionLevel,
}: {
  latencyMs: number;
  feeEstimate: number;
  networkHealth: string;
  transactionSpeed: string;
  congestionLevel?: string;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Network Health"
        subtitle="Live confirmation quality, congestion state, fee guidance, and throughput posture."
        action={<LiveStatusBadge label="Healthy" tone="success" />}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric
          label="Confirmation Time"
          value={`${latencyMs} ms`}
          description="Observed Devnet latency"
          icon={<TimerReset className="h-4 w-4 text-emerald-300" />}
        />
        <Metric
          label="TPS Quality"
          value={transactionSpeed}
          description="Execution speed class"
          icon={<Activity className="h-4 w-4 text-emerald-300" />}
        />
        <Metric
          label="Congestion Score"
          value={congestionLevel || "Moderate"}
          description={networkHealth}
          icon={<GaugeCircle className="h-4 w-4 text-emerald-300" />}
        />
        <Metric
          label="Fee Recommendation"
          value={`${formatNumber(feeEstimate, 6)} SOL`}
          description="Estimated network fee"
          icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
        />
      </div>
    </GlassCard>
  );
}

function Metric({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(34,197,94,0.06),rgba(255,255,255,0.02))] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
        {icon}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{description}</div>
    </div>
  );
}
