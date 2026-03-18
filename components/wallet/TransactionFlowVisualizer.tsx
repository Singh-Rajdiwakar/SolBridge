"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Radar, Shield, TimerReset, Zap } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import { EmptyStateBlock } from "@/components/wallet/EmptyStateBlock";
import { FlowNode } from "@/components/wallet/FlowNode";
import { FlowParticles } from "@/components/wallet/FlowParticles";
import { LiveStatusBadge } from "@/components/wallet/LiveStatusBadge";
import { shortenAddress } from "@/lib/solana";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

export function TransactionFlowVisualizer({
  walletAddress,
  receiver,
  amount,
  estimatedFee,
  valid,
  status,
  previewState = "idle",
}: {
  walletAddress?: string | null;
  receiver?: string | null;
  amount: number;
  estimatedFee: number;
  valid: boolean;
  status?: "Pending" | "Confirmed" | "Failed" | null;
  previewState?: "idle" | "previewing" | "ready";
}) {
  const hasDestination = Boolean(receiver);
  const routeReady = Boolean(walletAddress && receiver && amount > 0 && valid);
  const surge = status === "Pending" || status === "Confirmed" || previewState === "previewing";
  const eta = routeReady ? (surge ? "0.4 - 0.8 sec" : "0.8 - 1.4 sec") : "--";
  const badgeTone =
    status === "Failed"
      ? "danger"
      : status === "Confirmed"
        ? "success"
        : previewState === "ready" || routeReady
          ? "info"
          : "warning";
  const badgeLabel =
    status ||
    (previewState === "previewing"
      ? "Previewing"
      : previewState === "ready"
        ? "Simulation Ready"
        : routeReady
          ? "Path Ready"
          : hasDestination
            ? "Simulation Available"
            : "Awaiting Destination");
  const routeTone =
    status === "Failed"
      ? "amber"
      : status === "Confirmed"
        ? "emerald"
        : routeReady
          ? "cyan"
          : "slate";

  if (!walletAddress) {
    return (
      <GlassCard>
        <SectionHeader
          title="Transaction Flow Engine"
          subtitle="Preview transfer direction, fee route, and execution intensity before broadcasting."
        />
        <EmptyStateBlock
          title="No wallet signal available"
          description="Connect a wallet to activate route visualization, sender-to-receiver paths, and execution telemetry."
          icon={<Radar className="h-5 w-5" />}
        />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader
        title="Transaction Flow Engine"
        subtitle="Animated send-route preview showing destination readiness, fee posture, and execution energy before broadcast."
        action={<LiveStatusBadge label={badgeLabel} tone={badgeTone} pulse={status !== "Failed"} />}
      />

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,28,0.94),rgba(6,11,23,0.98))] p-5">
        <div className="wallet-grid pointer-events-none absolute inset-0 opacity-35" />
        <motion.div
          className="pointer-events-none absolute left-[-12%] top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-cyan-400/8 blur-[90px]"
          animate={{ opacity: [0.18, 0.34, 0.18], x: [0, 18, 0] }}
          transition={{ duration: 5.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <div className="relative flex flex-col gap-6">
          <div className="grid items-center gap-5 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
            <FlowNode
              title="Source Wallet"
              value={shortenAddress(walletAddress)}
              tone="cyan"
              subtitle="Connected execution source"
            />

            <div className="relative h-32">
              <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
              <div
                className={cn(
                  "absolute left-0 top-1/2 h-px w-full -translate-y-1/2",
                  routeTone === "emerald"
                    ? "bg-gradient-to-r from-emerald-400/10 via-emerald-300/70 to-emerald-400/10"
                    : routeTone === "cyan"
                      ? "bg-gradient-to-r from-cyan-400/10 via-cyan-300/68 to-cyan-400/10"
                      : routeTone === "amber"
                        ? "bg-gradient-to-r from-amber-400/10 via-amber-300/58 to-amber-400/10"
                        : "bg-gradient-to-r from-slate-600/20 via-slate-400/26 to-slate-600/20",
                )}
              />
              {routeReady ? (
                <>
                  <FlowParticles active tone={status === "Confirmed" ? "emerald" : "cyan"} surge={surge} />
                  <motion.div
                    className={cn(
                      "absolute left-0 top-1/2 h-px w-full -translate-y-1/2 blur-md",
                      status === "Confirmed" ? "bg-emerald-300/26" : "bg-cyan-300/22",
                    )}
                    animate={{ opacity: [0.18, surge ? 0.72 : 0.44, 0.18] }}
                    transition={{ duration: surge ? 0.9 : 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                </>
              ) : null}
              <motion.div
                className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-white/10 bg-[#0b1324]/92 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400"
                animate={surge ? { boxShadow: ["0 0 0 rgba(34,211,238,0)", "0 0 20px rgba(34,211,238,0.16)", "0 0 0 rgba(34,211,238,0)"] } : undefined}
                transition={{ duration: 1.2, repeat: surge ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
              >
                <ArrowRight className="h-3.5 w-3.5 text-cyan-200" />
                {routeReady ? "Path ready" : hasDestination ? "Simulation available" : "Awaiting destination"}
              </motion.div>
              <div className="absolute inset-x-0 bottom-2 flex justify-center">
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  {hasDestination ? "Directional route identified" : "Enter a recipient to begin transaction path analysis."}
                </div>
              </div>
            </div>

            <FlowNode
              title="Destination"
              value={receiver ? shortenAddress(receiver) : "Awaiting target"}
              tone={routeReady ? "emerald" : hasDestination ? "amber" : "slate"}
              subtitle={routeReady ? "Validated endpoint" : hasDestination ? "Destination detected" : "No recipient entered"}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <TelemetryBox
              label="Amount"
              value={routeReady ? `${formatNumber(amount, 4)} SOL` : "No amount"}
              note={routeReady ? "Transfer intensity linked to amount" : "Amount will energize route"}
              icon={<Zap className="h-4 w-4 text-cyan-200" />}
            />
            <TelemetryBox
              label="Network Fee"
              value={`${formatNumber(estimatedFee, 6)} SOL`}
              note="Estimated route cost"
              icon={<Shield className="h-4 w-4 text-cyan-200" />}
            />
            <TelemetryBox
              label="ETA"
              value={eta}
              note={routeReady ? "Healthy execution window" : "Timing activates with valid input"}
              icon={<TimerReset className="h-4 w-4 text-cyan-200" />}
            />
            <TelemetryBox
              label="Route Status"
              value={badgeLabel}
              note={valid ? "Simulation and confirmation path ready" : "Invalid paths remain isolated"}
              icon={<Radar className="h-4 w-4 text-cyan-200" />}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function TelemetryBox({
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
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
        {icon}
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm leading-6 text-slate-400">{note}</div>
    </div>
  );
}
