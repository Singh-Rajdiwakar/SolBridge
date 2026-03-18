import type { PoolsStats } from "@/types";

import { StakeStatsGrid } from "@/components/staking/StakeStatsGrid";

export function PoolsStatsGrid({ stats }: { stats: PoolsStats }) {
  return <StakeStatsGrid stats={{ cards: stats.cards }} />;
}
