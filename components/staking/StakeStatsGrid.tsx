import type { StakeOverviewStats } from "@/types";

import { StakeMetricCard } from "@/components/staking/StakeMetricCard";

export function StakeStatsGrid({ stats }: { stats: StakeOverviewStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.cards.map((item) => (
        <StakeMetricCard
          key={item.title}
          label={item.title}
          value={`${item.prefix || ""}${item.value}${item.suffix || ""}`}
          delta={`${item.change.toFixed(1)}%`}
          sparkline={item.chartData.map((entry) => entry.value)}
        />
      ))}
    </div>
  );
}
