"use client";

import { Copy, ExternalLink, Shield, Users } from "lucide-react";
import { toast } from "sonner";

import { FollowWalletButton } from "@/components/social/FollowWalletButton";
import { WalletBadgeList } from "@/components/social/WalletBadgeList";
import type { SocialProfileRecord } from "@/types";
import { formatCompactCurrency, formatDate, formatPercent } from "@/utils/format";

export function WalletProfileHero({ profile }: { profile: SocialProfileRecord }) {
  const copyAddress = async () => {
    await navigator.clipboard.writeText(profile.walletAddress);
    toast.success("Wallet address copied");
  };

  return (
    <div className="glass-panel p-6 md:p-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-xl font-semibold text-cyan-100">
            {(profile.displayName || profile.walletAddress).slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Public Wallet Profile</div>
              <h1 className="mt-2 text-3xl font-semibold text-white">{profile.displayName}</h1>
              <div className="mt-2 text-sm text-slate-400">{profile.bio || "Finance-first public wallet profile with portfolio, reputation, and activity visibility controls."}</div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-300">
              <button type="button" onClick={copyAddress} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:border-cyan-400/30 hover:text-white">
                <Copy className="h-4 w-4" />
                {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-6)}
              </button>
              <a
                href={`https://explorer.solana.com/address/${profile.walletAddress}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:border-cyan-400/30 hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                Explorer
              </a>
            </div>
            <WalletBadgeList badges={profile.badges} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Portfolio Value</div>
            <div className="mt-3 text-2xl font-semibold text-white">
              {profile.summary?.portfolioValue ? formatCompactCurrency(profile.summary.portfolioValue) : "Hidden"}
            </div>
            <div className={`mt-1 text-sm ${((profile.summary?.portfolioChange24h || 0) >= 0) ? "text-emerald-300" : "text-rose-300"}`}>
              {profile.summary?.portfolioChange24h != null ? formatPercent(profile.summary.portfolioChange24h) : "Summary only"}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Social Reach</div>
            <div className="mt-3 flex items-center gap-2 text-2xl font-semibold text-white">
              <Users className="h-5 w-5 text-cyan-300" />
              {profile.socialStats?.followers || 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">{profile.socialStats?.following || 0} following</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Reputation</div>
                <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                  <Shield className="h-4 w-4 text-cyan-300" />
                  {profile.reputation?.score ?? "--"} / 100
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {profile.reputation?.label || "Awaiting signal"}{profile.summary?.firstSeenAt ? ` • first seen ${formatDate(profile.summary.firstSeenAt)}` : ""}
                </div>
              </div>
              {!profile.isOwner ? <FollowWalletButton walletAddress={profile.walletAddress} isFollowing={profile.isFollowing} /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
