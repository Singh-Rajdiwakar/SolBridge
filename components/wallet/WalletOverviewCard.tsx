"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, TrendingUp, Waves } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { GlassCard, SectionHeader } from "@/components/shared";
import { NetworkBadge } from "@/components/wallet/NetworkBadge";
import { ProviderChip } from "@/components/wallet/ProviderChip";
import { SecurityBadge } from "@/components/wallet/SecurityBadge";
import type { WalletBalanceHistoryPoint } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

export function WalletOverviewCard({
  availableBalance,
  lockedBalance,
  usdEstimate,
  estimatedFee,
  activityLabel,
  walletAgeLabel,
  providerName,
  network,
  history,
}: {
  availableBalance: number;
  lockedBalance: number;
  usdEstimate: number;
  estimatedFee: number;
  activityLabel: string;
  walletAgeLabel: string;
  providerName: string;
  network: string;
  history: WalletBalanceHistoryPoint[];
}) {
  return (
    <GlassCard className="h-full">
      <SectionHeader
        title="Wallet Overview"
        subtitle="Operational balance, security posture, and liquidity signals for the active wallet."
        action={<SecurityBadge />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Available Balance", value: `${formatNumber(availableBalance, 4)} SOL`, note: formatCurrency(usdEstimate), icon: Waves },
          { label: "Locked Balance", value: `${formatNumber(lockedBalance, 4)} SOL`, note: "Staked or reserved liquidity", icon: Sparkles },
          { label: "Estimated Network Fee", value: `${formatNumber(estimatedFee, 6)} SOL`, note: "Current Devnet execution cost", icon: TrendingUp },
          { label: "Wallet Activity", value: activityLabel, note: walletAgeLabel, icon: ShieldCheck },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: index * 0.04 }}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
              <item.icon className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="mt-3 text-2xl font-semibold text-white">{item.value}</div>
            <div className="mt-1 text-sm text-slate-400">{item.note}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Balance Movement</div>
              <div className="mt-1 text-sm text-slate-400">Trend line for recent wallet value</div>
            </div>
            <div className="text-sm font-medium text-white">{formatCurrency(history.at(-1)?.value || usdEstimate)}</div>
          </div>
          <div className="mt-4 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="wallet-overview-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2.1} fill="url(#wallet-overview-fill)" />
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

        <div className="grid gap-3">
          <NetworkBadge network={network} className="justify-center" />
          <ProviderChip provider={providerName} className="justify-center" />
        </div>
      </div>
    </GlassCard>
  );
}
