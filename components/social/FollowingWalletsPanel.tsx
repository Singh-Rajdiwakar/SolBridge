"use client";

import type { SocialFollowingResponse } from "@/types";

import { PublicWalletCard } from "@/components/social/PublicWalletCard";
import { SocialActivityFeed } from "@/components/social/SocialActivityFeed";
import { SectionCard } from "@/components/dashboard/section-card";

export function FollowingWalletsPanel({ data }: { data?: SocialFollowingResponse }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard title="Following Wallets" description="Track expert operators, alternate wallets, and ecosystem participants from one social portfolio surface.">
        {data?.wallets?.length ? (
          <div className="space-y-4">
            {data.wallets.map((wallet) => (
              <PublicWalletCard
                key={wallet.walletAddress}
                wallet={{
                  walletAddress: wallet.walletAddress,
                  displayName: wallet.displayName,
                  avatar: wallet.avatar,
                  tags: wallet.tags,
                  badges: [],
                  currentValue: wallet.portfolioValue || 0,
                  change24h: wallet.portfolioChange24h || 0,
                  followerCount: wallet.followers,
                  risk: {
                    score: wallet.reputation?.score || 0,
                    label: wallet.reputation?.label || "Monitored",
                  },
                  diversity: {
                    score: 0,
                    label: "Portfolio view",
                  },
                  reputation: wallet.reputation || {
                    score: 0,
                    label: "Monitored",
                    summary: "No reputation summary available yet.",
                  },
                  latestActivityAt: wallet.latestActivityAt,
                }}
                isFollowing
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
            You are not following any public wallets yet.
          </div>
        )}
      </SectionCard>
      <SectionCard title="Following Feed" description="Recent staking, liquidity, governance, and snapshot events from wallets you follow.">
        <SocialActivityFeed
          items={data?.feed}
          emptyTitle="No following feed yet"
          emptyDescription="Follow a public wallet to start receiving finance-first on-chain activity updates."
        />
      </SectionCard>
    </div>
  );
}
