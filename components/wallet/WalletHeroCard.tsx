"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Copy,
  CreditCard,
  ExternalLink,
  GaugeCircle,
  Plus,
  QrCode,
  SendHorizontal,
  Shield,
  TerminalSquare,
  TimerReset,
  Zap,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { Button } from "@/components/ui/button";
import { buildExplorerAddressUrl, shortenAddress } from "@/lib/solana";
import { formatCurrency, formatNumber } from "@/utils/format";
import { LiveStatusBadge } from "@/components/wallet/LiveStatusBadge";
import { NetworkBadge } from "@/components/wallet/NetworkBadge";
import { ProviderChip } from "@/components/wallet/ProviderChip";
import { SecurityBadge } from "@/components/wallet/SecurityBadge";
import { WalletMetricCard } from "@/components/wallet/WalletMetricCard";
import type { WalletBalanceHistoryPoint } from "@/types";

const WalletIdentityOrb = dynamic(
  () => import("@/components/wallet/WalletIdentityOrb").then((module) => module.WalletIdentityOrb),
  {
    ssr: false,
    loading: () => <div className="hidden h-[19rem] rounded-xl border border-cyan-400/14 bg-white/[0.03] lg:block" />,
  },
);

function useAnimatedNumber(value: number, duration = 900) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const from = previousValueRef.current;
    const delta = value - from;
    const start = performance.now();
    let frame = 0;

    const tick = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + delta * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }

      previousValueRef.current = value;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return displayValue;
}

export function WalletHeroCard({
  connected,
  address,
  providerName,
  network,
  balanceSol,
  usdEstimate,
  portfolioChange,
  history,
  latencyMs,
  estimatedFee,
  transactionSpeed,
  networkHealth,
  riskLabel,
  orbStatus,
  onCopyAddress,
  onSend,
  onReceive,
  onSwap,
  onBuy,
  onAirdrop,
  onTerminal,
}: {
  connected: boolean;
  address: string | null;
  providerName: string | null;
  network: string;
  balanceSol: number;
  usdEstimate: number;
  portfolioChange: number;
  history: WalletBalanceHistoryPoint[];
  latencyMs: number;
  estimatedFee: number;
  transactionSpeed: string;
  networkHealth: string;
  riskLabel?: string;
  orbStatus?: "normal" | "success" | "warning" | "danger";
  onCopyAddress: () => void;
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
  onBuy: () => void;
  onAirdrop: () => void;
  onTerminal: () => void;
}) {
  const animatedBalance = useAnimatedNumber(balanceSol);
  const animatedUsd = useAnimatedNumber(usdEstimate, 1000);
  const latestValue = history.at(-1)?.value || usdEstimate;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[1.2rem] border border-cyan-400/18 bg-[linear-gradient(135deg,rgba(16,24,43,0.96),rgba(7,12,25,0.98))] px-5 py-5 shadow-[0_36px_96px_rgba(3,10,25,0.6)] md:px-6 md:py-6 xl:px-7"
    >
      <div className="wallet-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-1/2 h-60 w-60 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[-18%] h-72 w-72 rounded-full bg-blue-500/10 blur-[140px]" />
        <motion.div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent"
          animate={{ opacity: [0.35, 0.82, 0.35], x: ["-10%", "8%", "-10%"] }}
          transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(360px,0.84fr)] 2xl:gap-7">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <LiveStatusBadge
              label={connected ? "Wallet Live" : "Awaiting Wallet"}
              detail={connected ? "Connected" : "Standby"}
              tone={connected ? "success" : "warning"}
            />
            <NetworkBadge network={network} />
            <ProviderChip provider={providerName || "Retix Wallet"} active={connected} />
            <SecurityBadge level={connected ? "secure" : "warning"} backedUp={connected} />
          </div>

          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Retix Wallet Command Center</div>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
                Institutional wallet intelligence for live Solana operations.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                Real-time wallet control, on-chain telemetry, execution readiness, and blockchain monitoring in one premium surface.
              </p>
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 md:p-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)] 2xl:grid-cols-[minmax(0,1.22fr)_minmax(330px,0.78fr)]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(34,197,94,0.68)]" />
                Wallet Identity
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-400">Primary balance</div>
                <div className="text-[2.7rem] font-semibold tracking-[-0.05em] text-white md:text-[3.4rem]">
                  {formatNumber(animatedBalance, 4)} <span className="text-xl text-slate-400 md:text-2xl">SOL</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium text-slate-200">{formatCurrency(animatedUsd)}</span>
                  <span className={portfolioChange >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {portfolioChange >= 0 ? "+" : ""}
                    {formatNumber(portfolioChange, 2)}% in 24h
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#0a1324]/90 p-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Wallet Address</div>
                  <div className="mt-1 text-base font-semibold text-white">{address ? shortenAddress(address) : "--"}</div>
                  <div className="mt-1 truncate text-sm text-slate-400">
                    {address || "Connect a wallet to initialize wallet intelligence and monitoring."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="h-10" onClick={onCopyAddress} disabled={!address}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <a
                    href={address ? buildExplorerAddressUrl(address) : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition ${
                      address
                        ? "border-cyan-400/18 bg-cyan-400/8 text-cyan-100 hover:border-cyan-300/34 hover:bg-cyan-400/12"
                        : "pointer-events-none border-white/10 bg-white/[0.03] text-slate-500"
                    }`}
                  >
                    Explorer
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="grid gap-3 xl:content-start">
              <div className="grid gap-3 sm:grid-cols-2">
                <WalletMetricCard
                  label="Latency"
                  value={`${latencyMs} ms`}
                  description="Confirmation telemetry"
                  icon={<TimerReset className="h-4 w-4" />}
                  accent="green"
                />
                <WalletMetricCard
                  label="Tx Speed"
                  value={transactionSpeed}
                  description="Current execution pace"
                  icon={<Zap className="h-4 w-4" />}
                />
                <WalletMetricCard
                  label="Estimated Fee"
                  value={`${formatNumber(estimatedFee, 6)} SOL`}
                  description="Devnet fee estimate"
                  icon={<GaugeCircle className="h-4 w-4" />}
                />
                <WalletMetricCard
                  label="Risk State"
                  value={riskLabel || "Safe"}
                  description={networkHealth}
                  icon={<Shield className="h-4 w-4" />}
                  accent={riskLabel?.toLowerCase().includes("risk") ? "amber" : "blue"}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                <ActionButton label="Send" icon={<SendHorizontal className="h-4 w-4" />} onClick={onSend} primary />
                <ActionButton label="Receive" icon={<QrCode className="h-4 w-4" />} onClick={onReceive} />
                <ActionButton label="Swap" icon={<ArrowUpRight className="h-4 w-4" />} onClick={onSwap} />
                <ActionButton label="Buy" icon={<CreditCard className="h-4 w-4" />} onClick={onBuy} />
                <ActionButton label="Airdrop" icon={<Plus className="h-4 w-4" />} onClick={onAirdrop} />
                <ActionButton label="Terminal" icon={<TerminalSquare className="h-4 w-4" />} onClick={onTerminal} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(230px,0.82fr)_minmax(0,1.18fr)]">
            <div className="hidden xl:block">
              <WalletIdentityOrb status={orbStatus || "normal"} />
            </div>

            <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Wallet Value Trend</div>
                  <div className="mt-2 text-xl font-semibold text-white">{formatCurrency(latestValue)}</div>
                  <div className="mt-1 text-sm text-slate-400">Live wallet valuation with settlement drift and activity markers.</div>
                </div>
                <LiveStatusBadge label="Telemetry" detail="Live" tone="info" />
              </div>
              <div className="mt-5 h-48 rounded-lg border border-white/10 bg-[#091122]/90 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="wallet-hero-card-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.36} />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      isAnimationActive
                      animationDuration={900}
                      type="monotone"
                      dataKey="value"
                      stroke="#22D3EE"
                      strokeWidth={2.2}
                      fill="url(#wallet-hero-card-fill)"
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(120,170,255,0.14)",
                        background: "rgba(10,16,32,0.97)",
                        color: "#EAF2FF",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <TelemetryChip label="Provider" value={providerName || "Retix"} />
                <TelemetryChip label="Network" value={network} />
                <TelemetryChip label="Health" value={networkHealth} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 xl:hidden">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Wallet Orb</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              The identity orb stays lightweight on smaller screens so the wallet remains fast and readable while preserving the premium telemetry layer.
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  primary = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onClick={onClick}
      className={`group holo-shimmer relative flex h-11 items-center justify-center gap-2 overflow-hidden rounded-md border px-4 text-sm font-medium ${
        primary
          ? "border-blue-400/24 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-[0_18px_46px_rgba(18,85,220,0.3)]"
          : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-cyan-300/24 hover:bg-white/[0.06]"
      }`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {label}
      </span>
    </motion.button>
  );
}

function TelemetryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#0b1324]/90 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
