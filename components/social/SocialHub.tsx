"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { LeaderboardCard } from "@/components/social/LeaderboardCard";
import { PublicWalletCard } from "@/components/social/PublicWalletCard";
import { FollowingWalletsPanel } from "@/components/social/FollowingWalletsPanel";
import { SocialActivityFeed } from "@/components/social/SocialActivityFeed";
import { SocialHeader } from "@/components/social/SocialHeader";
import { SocialSearchBar } from "@/components/social/SocialSearchBar";
import { TrendingWalletsPanel } from "@/components/social/TrendingWalletsPanel";
import { SectionCard } from "@/components/dashboard/section-card";
import { useLeaderboards } from "@/hooks/useLeaderboards";
import { useTrendingWallets } from "@/hooks/useTrendingWallets";
import { socialApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { formatCompactCurrency } from "@/utils/format";

export function SocialHub({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (value: string) => void;
}) {
  const authUser = useAuthStore((state) => state.user);
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<"trending" | "followers" | "value">("trending");
  const [submittedSearch, setSubmittedSearch] = useState<{
    q: string;
    tag: string;
    sort: "trending" | "followers" | "value";
  }>({ q: "", tag: "", sort: "trending" });

  const trendingQuery = useTrendingWallets(6);
  const leaderboardsQuery = useLeaderboards(period);
  const followingQuery = useQuery({
    queryKey: ["social", "following"],
    queryFn: socialApi.following,
    enabled: Boolean(authUser),
  });
  const feedQuery = useQuery({
    queryKey: ["social", "feed", "global"],
    queryFn: () => socialApi.feed({ scope: "global" }),
  });
  const searchQuery = useQuery({
    queryKey: ["social", "search", submittedSearch],
    queryFn: () => socialApi.search(submittedSearch),
  });

  const spotlight = trendingQuery.data?.[0] || null;
  const discoverResults = useMemo(
    () => (submittedSearch.q || submittedSearch.tag ? searchQuery.data || [] : trendingQuery.data || []),
    [searchQuery.data, submittedSearch.q, submittedSearch.tag, trendingQuery.data],
  );

  return (
    <div className="space-y-6">
      <SocialHeader
        activeTab={activeTab}
        onTabChange={onTabChange}
        totalTrending={trendingQuery.data?.length || 0}
        totalFollowing={followingQuery.data?.wallets.length || 0}
      />

      {activeTab === "trending" ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <TrendingWalletsPanel wallets={trendingQuery.data} />
            <SectionCard title="Wallet Spotlight" description="One high-signal public wallet surfaced for recruiter-friendly product storytelling.">
              {spotlight ? (
                <div className="rounded-lg border border-cyan-400/15 bg-cyan-500/[0.05] p-5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">Trending now</div>
                  <div className="mt-3 text-2xl font-semibold text-white">{spotlight.displayName}</div>
                  <div className="mt-2 text-sm text-slate-300">{spotlight.trendReason}</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-white/10 bg-slate-950/60 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Portfolio</div>
                      <div className="mt-2 text-lg font-semibold text-white">{formatCompactCurrency(spotlight.currentValue)}</div>
                    </div>
                    <div className="rounded-md border border-white/10 bg-slate-950/60 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Followers</div>
                      <div className="mt-2 text-lg font-semibold text-white">{spotlight.followerCount}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
                  No public wallet is trending yet.
                </div>
              )}
            </SectionCard>
          </div>
          <SectionCard title="Global Social Feed" description="Live finance-first discovery feed for public on-chain profiles.">
            <SocialActivityFeed
              items={feedQuery.data}
              emptyTitle="No social feed yet"
              emptyDescription="Public wallets, staking events, votes, and portfolio snapshot shares will appear here."
            />
          </SectionCard>
        </>
      ) : null}

      {activeTab === "leaderboards" ? (
        <SectionCard
          title="Ecosystem Leaderboards"
          description="Rule-based leaderboard engine built on public on-chain wallet behavior and privacy-aware profile settings."
          action={
            <div className="flex gap-2">
              {(["today", "7d", "30d", "all"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${period === value ? "border-cyan-400/30 bg-cyan-500/10 text-white" : "border-white/10 bg-white/[0.03] text-slate-400"}`}
                >
                  {value}
                </button>
              ))}
            </div>
          }
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {(leaderboardsQuery.data || []).map((category) => (
              <LeaderboardCard key={category.key} category={category} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "following" ? <FollowingWalletsPanel data={followingQuery.data} /> : null}

      {activeTab === "discover" ? (
        <div className="space-y-6">
          <SectionCard title="Discover Public Profiles" description="Search by wallet address, profile name, tags, and wallet badges.">
            <SocialSearchBar
              query={query}
              tag={tag}
              sort={sort}
              onQueryChange={setQuery}
              onTagChange={setTag}
              onSortChange={setSort}
              onSubmit={() => setSubmittedSearch({ q: query, tag, sort })}
            />
          </SectionCard>

          <SectionCard title="Discover Results" description="Search results reuse public profiles, wallet badges, and on-chain analytics rather than duplicating portfolio systems.">
            {discoverResults.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {discoverResults.map((wallet) => (
                  <PublicWalletCard key={wallet.walletAddress} wallet={wallet} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
                No public wallet matched this search.
              </div>
            )}
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}
