"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Coins, ImageIcon, RefreshCcw, Sparkles } from "lucide-react";

import { EmptyState, GlassCard, SectionHeader } from "@/components/shared";
import type { TransactionRecord } from "@/types";
import { formatDate, formatNumber } from "@/utils/format";

function activityIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("received") || normalized.includes("airdrop")) {
    return ArrowDownLeft;
  }
  if (normalized.includes("swap")) {
    return RefreshCcw;
  }
  if (normalized.includes("token") || normalized.includes("mint")) {
    return Coins;
  }
  if (normalized.includes("nft")) {
    return ImageIcon;
  }
  return ArrowUpRight;
}

export function WalletActivityTimeline({
  transactions,
}: {
  transactions: TransactionRecord[];
}) {
  const items = transactions.slice(0, 6);

  return (
    <GlassCard>
      <SectionHeader
        title="Wallet Activity Timeline"
        subtitle="Chronological flow of transfers, swaps, mints, and wallet-level system activity."
        action={<Sparkles className="h-4 w-4 text-cyan-300" />}
      />

      {items.length === 0 ? (
        <EmptyState title="No wallet events yet" description="Recent actions will stream into this timeline after the first wallet interaction." />
      ) : (
        <div className="relative pl-6">
          <div className="absolute bottom-4 left-[0.4rem] top-3 w-px bg-gradient-to-b from-cyan-300/40 via-blue-500/20 to-transparent" />
          <div className="space-y-4">
            {items.map((transaction, index) => {
              const Icon = activityIcon(transaction.type);

              return (
                <motion.div
                  key={transaction._id}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.24, delay: index * 0.05 }}
                  className="relative rounded-lg border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="absolute -left-[1.62rem] top-5 flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/18 bg-[#091322]">
                    <Icon className="h-3 w-3 text-cyan-200" />
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{transaction.type}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {formatNumber(transaction.amount, transaction.token === "BONK" ? 0 : 4)} {transaction.token}
                      </div>
                    </div>
                    <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      {transaction.status}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    <span>{formatDate(transaction.createdAt)}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                    <span>{formatNumber(transaction.confidenceScore || 0, 0)}% confidence</span>
                    {transaction.riskLevel ? (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-600" />
                        <span>{transaction.riskLevel}</span>
                      </>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
