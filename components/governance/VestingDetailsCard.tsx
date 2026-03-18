import { GlassCard, SectionHeader } from "@/components/shared";
import type { VestingData } from "@/types";
import { formatCompactCurrency, formatNumber } from "@/utils/format";

export function VestingDetailsCard({ vesting }: { vesting: VestingData }) {
  const rows = [
    ["Locked governance tokens", formatNumber(vesting.lockedGovernanceTokens)],
    ["Vesting duration", `${vesting.vestingDuration} days`],
    ["Current voting power", formatNumber(vesting.currentVotingPower)],
    ["Delegated power", formatNumber(vesting.delegatedPower)],
    ["Claimable governance rewards", formatCompactCurrency(vesting.claimableGovernanceRewards)],
  ];

  return (
    <GlassCard>
      <SectionHeader
        title="Vote Power / Vesting Details"
        subtitle="Shows locked governance tokens, vesting duration, current voting power, delegated power, and claimable rewards."
      />

      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4"
          >
            <div className="text-sm text-slate-400">{label}</div>
            <div className="text-lg font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
