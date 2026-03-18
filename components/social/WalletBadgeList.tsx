"use client";

import type { SocialBadgeRecord } from "@/types";
import { cn } from "@/utils/cn";

const BADGE_TONES: Record<string, string> = {
  "top-staker": "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  "governance-voice": "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
  "liquidity-expert": "border-sky-400/20 bg-sky-500/10 text-sky-200",
  "power-trader": "border-blue-400/20 bg-blue-500/10 text-blue-200",
  "whale-wallet": "border-amber-400/20 bg-amber-500/10 text-amber-200",
};

export function WalletBadgeList({ badges, className }: { badges?: SocialBadgeRecord[]; className?: string }) {
  if (!badges?.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => (
        <div
          key={`${badge.walletAddress}-${badge.badgeKey}`}
          title={badge.reason}
          className={cn(
            "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
            BADGE_TONES[badge.badgeKey] || "border-white/10 bg-white/[0.04] text-slate-200",
          )}
        >
          {badge.badgeLabel}
        </div>
      ))}
    </div>
  );
}
