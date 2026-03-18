"use client";

import type { SocialTrendingWallet } from "@/types";

import { PublicWalletCard } from "@/components/social/PublicWalletCard";
import { SectionCard } from "@/components/dashboard/section-card";

export function TrendingWalletsPanel({ wallets }: { wallets?: SocialTrendingWallet[] }) {
  return (
    <SectionCard
      title="Trending Wallets"
      description="Discover wallets with strong staking growth, governance activity, liquidity moves, and public profile momentum."
    >
      {wallets?.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {wallets.map((wallet) => (
            <PublicWalletCard key={wallet.walletAddress} wallet={wallet} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          No public trending wallets available yet. Turn on discoverability from settings to populate ecosystem discovery.
        </div>
      )}
    </SectionCard>
  );
}
