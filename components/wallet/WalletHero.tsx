"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Copy,
  CreditCard,
  ExternalLink,
  GaugeCircle,
  Network,
  Plus,
  QrCode,
  SendHorizontal,
  Shield,
  TerminalSquare,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { Button } from "@/components/ui/button";
import { NetworkBadge } from "@/components/wallet/NetworkBadge";
import { ProviderChip } from "@/components/wallet/ProviderChip";
import { SecurityBadge } from "@/components/wallet/SecurityBadge";
import { buildExplorerAddressUrl, shortenAddress } from "@/lib/solana";
import type { WalletBalanceHistoryPoint } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

const WalletIdentityOrb = dynamic(
  () => import("@/components/wallet/WalletIdentityOrb").then((module) => module.WalletIdentityOrb),
  {
    ssr: false,
    loading: () => <div className="hidden h-[18rem] rounded-lg border border-cyan-400/14 bg-white/[0.03] lg:block" />,
  },
);

const itemMotion = {
  initial: { opacity: 0, y: 16, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function WalletHero({
  connected,
  address,
  providerName,
  network,
  balanceSol,
  usdEstimate,
  portfolioChange,
  history,
  latencyMs,
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
  const latestValue = history.at(-1)?.value || usdEstimate;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl border border-cyan-400/16 bg-[linear-gradient(135deg,rgba(17,27,49,0.94),rgba(6,11,23,0.98))] p-5 shadow-[0_32px_90px_rgba(4,10,24,0.58)] md:p-6"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-cyan-400/8 blur-[120px]" />
        <div className="absolute right-[-8%] top-[-12%] h-64 w-64 rounded-full bg-blue-500/10 blur-[140px]" />
        <motion.div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
          animate={{ opacity: [0.3, 0.8, 0.3], x: ["-8%", "8%", "-8%"] }}
          transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <motion.div {...itemMotion} transition={{ duration: 0.28 }} className="flex flex-wrap items-center gap-2">
            <NetworkBadge network={network} />
            <SecurityBadge level={connected ? "secure" : "warning"} backedUp={connected} />
            <ProviderChip provider={providerName || "Retix Wallet"} active={connected} />
            <div className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              connected
                ? "border border-emerald-400/16 bg-emerald-500/8 text-emerald-100"
                : "border border-amber-400/16 bg-amber-500/8 text-amber-100"
            }`}>
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.72)]" : "bg-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.62)]"}`} />
              {connected ? "Connected" : "Standby"}
            </div>
          </motion.div>

          <motion.div {...itemMotion} transition={{ duration: 0.34, delay: 0.03 }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Retix Wallet Ultra</div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-[3.2rem]">Crypto Control Center</h1>
              <div className="mb-1 inline-flex items-center gap-2 rounded-md border border-cyan-400/16 bg-cyan-400/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
                {connected ? `${network} online` : "Awaiting wallet"}
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              A next-generation Solana workspace with animated network telemetry, command-center wallet actions, and institutional-grade execution feedback.
            </p>
          </motion.div>

          <motion.div {...itemMotion} transition={{ duration: 0.34, delay: 0.06 }} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Wallet Address</div>
                <div className="mt-2 text-xl font-semibold text-white">{address ? shortenAddress(address) : "--"}</div>
                <div className="mt-1 break-all text-sm text-slate-400">{address || "Create or connect a wallet to initialize the Retix command center."}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={onCopyAddress} disabled={!address}>
                  <Copy className="h-4 w-4" />
                  Copy Address
                </Button>
                <a
                  href={address ? buildExplorerAddressUrl(address) : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 transition ${
                    address ? "hover:border-cyan-300/24 hover:text-white" : "pointer-events-none opacity-50"
                  }`}
                >
                  View on Solana Explorer
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div {...itemMotion} transition={{ duration: 0.36, delay: 0.08 }} className="flex flex-wrap gap-3">
            <Button onClick={onSend}>
              <SendHorizontal className="h-4 w-4" />
              Send
            </Button>
            <Button variant="secondary" onClick={onReceive}>
              <QrCode className="h-4 w-4" />
              Receive
            </Button>
            <Button variant="secondary" onClick={onSwap}>
              <ArrowUpRight className="h-4 w-4" />
              Swap
            </Button>
            <Button variant="secondary" onClick={onBuy}>
              <CreditCard className="h-4 w-4" />
              Buy
            </Button>
            <Button variant="secondary" onClick={onAirdrop}>
              <Plus className="h-4 w-4" />
              Airdrop
            </Button>
            <Button variant="secondary" onClick={onTerminal}>
              <TerminalSquare className="h-4 w-4" />
              Terminal Mode
            </Button>
          </motion.div>

          <motion.div {...itemMotion} transition={{ duration: 0.38, delay: 0.12 }} className="grid gap-3 md:grid-cols-4">
            <StatusMetric label="Latency" value={`${latencyMs} ms`} note="Network pulse" icon={<Network className="h-4 w-4 text-cyan-200" />} />
            <StatusMetric label="Execution" value={transactionSpeed} note="Transaction speed" icon={<GaugeCircle className="h-4 w-4 text-cyan-200" />} />
            <StatusMetric label="Security" value={riskLabel || "Safe"} note="Wallet posture" icon={<Shield className="h-4 w-4 text-cyan-200" />} />
            <StatusMetric label="Activity" value={portfolioChange >= 0 ? "Positive" : "Volatile"} note="24h wallet motion" icon={<Activity className="h-4 w-4 text-cyan-200" />} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.34, delay: 0.08 }}
          className="grid gap-4"
        >
          <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="hidden lg:block">
              <WalletIdentityOrb status={orbStatus || "normal"} />
            </div>

            <div className="rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">SOL Balance</div>
                  <div className="mt-3 text-3xl font-semibold text-white">{formatNumber(balanceSol, 4)}</div>
                  <div className="mt-1 text-sm text-slate-400">{formatCurrency(usdEstimate)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">24h Portfolio</div>
                  <div className={`mt-3 text-3xl font-semibold ${portfolioChange >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {portfolioChange >= 0 ? "+" : ""}
                    {formatNumber(portfolioChange, 2)}%
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{networkHealth}</div>
                </div>
              </div>

              <div className="mt-4 h-40 rounded-lg border border-white/10 bg-[#091122] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Portfolio Movement</div>
                    <div className="mt-1 text-sm text-slate-400">Live balance timeline with settlement markers</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{formatCurrency(latestValue)}</div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Current value</div>
                  </div>
                </div>
                <div className="mt-4 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="wallet-hero-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.32} />
                          <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={2.2} fill="url(#wallet-hero-fill)" />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid rgba(120,170,255,0.14)",
                          background: "rgba(10,16,32,0.96)",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <InlineMetric label="Network Health" value={networkHealth} />
                <InlineMetric label="Provider" value={providerName || "Retix"} />
                <InlineMetric label="Security" value={riskLabel || "Analyzing"} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 lg:hidden">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Wallet Identity</div>
            <div className="mt-2 text-sm text-slate-300">3D wallet identity orb is enabled on larger screens to keep mobile interactions lightweight and fast.</div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function StatusMetric({
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
        <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
        {icon}
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{note}</div>
    </div>
  );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
