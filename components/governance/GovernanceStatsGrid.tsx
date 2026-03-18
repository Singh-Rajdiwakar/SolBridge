"use client";

import { StatCard } from "@/components/shared";
import type { GovernanceStats } from "@/types";

export function GovernanceStatsGrid({ stats }: { stats: GovernanceStats }) {
  const cards = [
    { title: "Active Proposals", value: stats.activeProposals },
    { title: "Total Votes Cast", value: stats.totalVotesCast },
    { title: "Your Voting Power", value: stats.yourVotingPower },
    { title: "Treasury Participation", value: stats.treasuryParticipation, change: "0", chartData: [stats.treasuryParticipation] },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          change={card.change || "0"}
          chartData={card.chartData || [Number(card.value)]}
        />
      ))}
    </div>
  );
}
