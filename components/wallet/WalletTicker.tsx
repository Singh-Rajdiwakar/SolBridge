"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Coins, Droplets, ImageIcon, Sparkles } from "lucide-react";

import { GlassCard } from "@/components/shared";
import type { TransactionRecord } from "@/types";
import { formatNumber } from "@/utils/format";

function itemIcon(type: string) {
  if (type.toLowerCase().includes("swap")) {
    return ArrowLeftRight;
  }
  if (type.toLowerCase().includes("mint")) {
    return Coins;
  }
  if (type.toLowerCase().includes("nft")) {
    return ImageIcon;
  }
  if (type.toLowerCase().includes("airdrop")) {
    return Sparkles;
  }
  return Droplets;
}

export function WalletTicker({ transactions }: { transactions: TransactionRecord[] }) {
  const items = useMemo(() => {
    const fallback = [
      { label: "Wallet Sync", token: "SOL", amount: 0.14, status: "Confirmed" },
      { label: "Token Mint", token: "RTX", amount: 2400, status: "Verified" },
      { label: "Swap Route", token: "USDC", amount: 18.2, status: "Live" },
    ];

    const base = transactions.length
      ? transactions.slice(0, 8).map((transaction) => ({
          label: transaction.type,
          token: transaction.token,
          amount: transaction.amount,
          status: transaction.status,
        }))
      : fallback;

    return [...base, ...base];
  }, [transactions]);

  return (
    <GlassCard className="overflow-hidden py-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Live Blockchain Feed</div>
          <div className="mt-1 text-sm text-slate-400">Wallet activity, token mint events, and settlement pulses flowing in real time.</div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-cyan-400/16 bg-cyan-400/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
          Live Feed
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[rgba(14,22,40,0.96)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[rgba(14,22,40,0.96)] to-transparent" />
        <motion.div
          className="flex min-w-max gap-3 px-3 py-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          {items.map((item, index) => {
            const Icon = itemIcon(item.label);

            return (
              <div
                key={`${item.label}-${item.token}-${index}`}
                className="flex min-w-[15rem] items-center gap-3 rounded-md border border-white/10 bg-[linear-gradient(180deg,rgba(17,27,49,0.82),rgba(9,14,28,0.72))] px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/14 bg-cyan-400/10">
                  <Icon className="h-4 w-4 text-cyan-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{item.label}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {formatNumber(item.amount, item.token === "BONK" ? 0 : 4)} {item.token}
                  </div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {item.status}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </GlassCard>
  );
}
