"use client";

import { useParams } from "next/navigation";
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  SharedPortfolioSnapshotCard,
  SocialActivityFeed,
  WalletProfileHero,
  WalletReputationCard,
} from "@/components/social";
import { useSocialProfile } from "@/hooks/useSocialProfile";
import { formatCompactCurrency } from "@/utils/format";

export default function PublicWalletProfilePage() {
  const params = useParams<{ walletAddress: string }>();
  const walletAddress = String(params.walletAddress || "");
  const profileQuery = useSocialProfile(walletAddress);

  const profile = profileQuery.data;

  if (!profileQuery.isLoading && profile && !profile.isAccessible) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <PageHeader
          title={profile.displayName || "Wallet profile"}
          subtitle={profile.privateNotice || "This wallet profile is not publicly visible."}
          badge="Private Profile"
        />
        <SectionCard title="Profile unavailable" description="The owner has not opted into public visibility for this wallet.">
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
            Public wallet discovery respects user-controlled visibility settings.
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-8">
      {profile ? <WalletProfileHero profile={profile} /> : null}

      <WalletReputationCard
        reputation={profile?.reputation}
        risk={profile?.summary?.risk || null}
        diversity={profile?.summary?.diversity || null}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Portfolio Visibility" description="Public portfolio summary driven by wallet visibility settings and indexed portfolio snapshots.">
          {profile?.summary?.chart?.length ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Visible Value</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {profile.summary.portfolioValue != null ? formatCompactCurrency(profile.summary.portfolioValue) : "Hidden"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Staking</div>
                  <div className="mt-2 text-xl font-semibold text-white">{profile.summary.stakingExposure ?? "--"}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Liquidity</div>
                  <div className="mt-2 text-xl font-semibold text-white">{profile.summary.liquidityExposure ?? "--"}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Governance</div>
                  <div className="mt-2 text-xl font-semibold text-white">{profile.summary.governanceParticipation ?? "--"}</div>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profile.summary.chart}>
                    <defs>
                      <linearGradient id="profileValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15,23,42,0.92)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.4} fill="url(#profileValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
              No public portfolio history is visible for this wallet.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Asset Allocation" description="Top visible assets and concentration across the public wallet surface.">
          {profile?.summary?.tokenAllocation?.length ? (
            <div className="space-y-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15,23,42,0.92)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                      }}
                    />
                    <Pie
                      data={profile.summary.tokenAllocation}
                      dataKey="value"
                      nameKey="symbol"
                      innerRadius={74}
                      outerRadius={112}
                      paddingAngle={3}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {profile.summary.topAssets.map((asset) => (
                  <div key={`${profile.walletAddress}-${asset.symbol}`} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="font-medium text-white">{asset.symbol}</div>
                    <div className="text-sm text-slate-400">{asset.allocationPercent.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
              Asset allocation is hidden or not available.
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="Public Activity Feed" description="Recent staking, wallet, and protocol events exposed through the social profile.">
          <SocialActivityFeed
            items={profile?.activity}
            emptyTitle="No public activity available"
            emptyDescription="This wallet has not exposed recent on-chain activity to the public social layer."
          />
        </SectionCard>
        <SectionCard title="Shared Snapshots" description="Portfolio snapshots that the wallet owner chose to share publicly.">
          {profile?.sharedSnapshots?.length ? (
            <div className="space-y-4">
              {profile.sharedSnapshots.map((snapshot) => (
                <SharedPortfolioSnapshotCard key={snapshot._id} snapshot={snapshot} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
              No public portfolio snapshots shared yet.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
