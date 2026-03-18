"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { SocialLeaderboardCategory } from "@/types";

const MOVEMENT_ICON = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  unchanged: ArrowRight,
  new: ArrowUpRight,
} as const;

export function LeaderboardCard({ category }: { category: SocialLeaderboardCategory }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{category.period}</div>
      <div className="mt-2 text-lg font-semibold text-white">{category.label}</div>
      <div className="mt-1 text-sm text-slate-400">{category.description}</div>
      <div className="mt-4 space-y-3">
        {category.items.slice(0, 5).map((item) => {
          const Icon = MOVEMENT_ICON[item.movement];
          return (
            <div key={`${category.key}-${item.walletAddress}`} className="flex items-center justify-between rounded-md border border-white/10 bg-slate-950/50 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-slate-400">#{item.rank}</div>
                <div>
                  <Link href={`/profile/${item.walletAddress}`} className="text-sm font-semibold text-white transition hover:text-cyan-200">
                    {item.displayName}
                  </Link>
                  <div className="text-xs text-slate-500">{item.badge}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{item.metricLabel}</div>
                  <div className="text-xs text-slate-500">{item.change24h.toFixed(2)}% 24h</div>
                </div>
                <Icon className={`h-4 w-4 ${item.movement === "down" ? "text-rose-300" : "text-emerald-300"}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
