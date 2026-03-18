import type { LockPeriod } from "@/types";

import { GlassCard, SectionHeader } from "@/components/shared";
import { LockPeriodCard } from "@/components/staking/LockPeriodCard";

export function LockPeriodGrid({
  periods,
  selectedPeriod,
  onSelect,
  onStakeNow,
}: {
  periods: LockPeriod[];
  selectedPeriod?: string;
  onSelect: (periodId: string) => void;
  onStakeNow: (periodId: string) => void;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Lock Period Options"
        subtitle="Displays all staking lock duration cards."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {periods.map((period) => (
          <LockPeriodCard
            key={period._id}
            period={period}
            selected={selectedPeriod === period._id}
            onClick={() => onSelect(period._id)}
            onStake={() => onStakeNow(period._id)}
          />
        ))}
      </div>
    </GlassCard>
  );
}
