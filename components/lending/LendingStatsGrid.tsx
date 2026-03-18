"use client";

import { StatCard } from "@/components/shared";
import type { LendingStats } from "@/types";

export function LendingStatsGrid({ stats }: { stats: LendingStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {stats.cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          change={`${card.change}`}
          chartData={card.chartData.map((point) => point.value)}
        />
      ))}
    </div>
  );
}
