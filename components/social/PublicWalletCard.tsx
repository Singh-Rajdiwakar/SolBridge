"use client";

import { ExternalLink, Users } from "lucide-react";
import Link from "next/link";

import { FollowWalletButton } from "@/components/social/FollowWalletButton";
import { WalletBadgeList } from "@/components/social/WalletBadgeList";
import type { SocialSearchResult, SocialTrendingWallet } from "@/types";
import { formatCompactCurrency, formatPercent, formatRelativeTime } from "@/utils/format";

type CardWallet =
  | SocialTrendingWallet
  | (SocialSearchResult & {
      isFollowing?: boolean;
    });

function getWalletDelta(wallet: CardWallet) {
  return "valueChange" in wallet ? wallet.valueChange : wallet.change24h;
}

export function PublicWalletCard({ wallet, isFollowing }: { wallet: CardWallet; isFollowing?: boolean }) {
  const delta = getWalletDelta(wallet);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-lg font-semibold text-cyan-100">
            {(wallet.displayName || wallet.walletAddress).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link href={`/profile/${wallet.walletAddress}`} className="text-lg font-semibold text-white transition hover:text-cyan-200">
              {wallet.displayName}
            </Link>
            <div className="mt-1 text-sm text-slate-400">{wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-6)}</div>
            {"tags" in wallet && wallet.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {wallet.tags.slice(0, 3).map((tag) => (
                  <div key={`${wallet.walletAddress}-${tag}`} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                    {tag}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <FollowWalletButton walletAddress={wallet.walletAddress} isFollowing={isFollowing} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-white/10 bg-slate-950/60 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Portfolio</div>
          <div className="mt-2 text-lg font-semibold text-white">{formatCompactCurrency(wallet.currentValue)}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-slate-950/60 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h</div>
          <div className={`mt-2 text-lg font-semibold ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {formatPercent(delta)}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-slate-950/60 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Followers</div>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
            <Users className="h-4 w-4 text-cyan-300" />
            {wallet.followerCount}
          </div>
        </div>
      </div>

      {"badges" in wallet ? <WalletBadgeList badges={wallet.badges} className="mt-4" /> : null}

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-slate-400">
          {"trendReason" in wallet ? wallet.trendReason : wallet.reputation?.summary || "Visible social wallet profile"}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">{wallet.latestActivityAt ? formatRelativeTime(wallet.latestActivityAt) : "No recent activity"}</div>
          <Link href={`/profile/${wallet.walletAddress}`} className="inline-flex items-center gap-1 text-cyan-200 transition hover:text-cyan-100">
            Open profile
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
