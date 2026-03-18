"use client";

import type { ReactNode } from "react";
import { Activity, Cpu, Layers3, TimerReset } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";

export function NetworkPerformanceCard({
  latencyMs,
  feeEstimate,
  rpcStatus,
  blockHeight,
}: {
  latencyMs: number;
  feeEstimate: number;
  rpcStatus?: string;
  blockHeight?: number;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Network Performance"
        subtitle="A recruiter-readable explanation of why Retix Wallet is built on Solana."
        action={<Activity className="h-4 w-4 text-cyan-300" />}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric
          label="Network"
          value="Solana Devnet"
          note="Dev-friendly public test environment"
          icon={<Layers3 className="h-4 w-4 text-cyan-300" />}
        />
        <Metric
          label="Avg Confirmation Time"
          value={`${latencyMs}ms - 2s`}
          note="Fast finality for wallet UX"
          icon={<TimerReset className="h-4 w-4 text-cyan-300" />}
        />
        <Metric
          label="Transaction Throughput"
          value="High"
          note="Parallel execution ready"
          icon={<Cpu className="h-4 w-4 text-cyan-300" />}
        />
        <Metric
          label="Consensus"
          value="Proof of History"
          note={`Estimated fee ${feeEstimate.toFixed(6)} SOL`}
          icon={<Activity className="h-4 w-4 text-cyan-300" />}
        />
        <Metric
          label="RPC Status"
          value={rpcStatus || "Healthy"}
          note={blockHeight ? `Block height ${blockHeight.toLocaleString()}` : "Live RPC heartbeat"}
          icon={<Activity className="h-4 w-4 text-cyan-300" />}
        />
      </div>

      <div className="mt-4 rounded-lg border border-cyan-400/16 bg-cyan-400/8 p-4 text-sm leading-6 text-slate-200">
        Solana uses Proof of History and parallel transaction execution to achieve high throughput and low latency,
        which makes wallet interactions feel responsive while keeping fees extremely low.
      </div>
    </GlassCard>
  );
}

function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
        {icon}
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{note}</div>
    </div>
  );
}
