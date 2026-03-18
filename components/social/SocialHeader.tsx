"use client";

import { Activity, Trophy, Users } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { FilterTabs } from "@/components/shared";
import { Button } from "@/components/ui/button";

export function SocialHeader({
  activeTab,
  onTabChange,
  totalTrending,
  totalFollowing,
}: {
  activeTab: string;
  onTabChange: (value: string) => void;
  totalTrending: number;
  totalFollowing: number;
}) {
  return (
    <PageHeader
      title="Web3 Social Layer"
      subtitle="Discover public wallets, follow high-signal operators, compare ecosystem activity, and surface finance-first recognition across staking, trading, liquidity, and governance."
      badge="New Social Layer"
      action={
        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs
            items={[
              { label: "Trending", value: "trending" },
              { label: "Leaderboards", value: "leaderboards" },
              { label: "Following", value: "following" },
              { label: "Discover", value: "discover" },
            ]}
            active={activeTab}
            onChange={onTabChange}
          />
          <Button variant="secondary">
            <Activity className="h-4 w-4" />
            {totalTrending} trending
          </Button>
          <Button variant="secondary">
            <Users className="h-4 w-4" />
            {totalFollowing} following
          </Button>
          <Button variant="secondary">
            <Trophy className="h-4 w-4" />
            Live leaderboards
          </Button>
        </div>
      }
    />
  );
}
