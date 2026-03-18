import { GlassCard, SectionHeader } from "@/components/shared";
import type { LendingPosition } from "@/types";
import { formatCompactCurrency, formatNumber } from "@/utils/format";
import { HealthFactorGauge } from "@/components/lending/HealthFactorGauge";

export function PositionSummaryCard({ position }: { position: LendingPosition }) {
  const summaryItems = [
    ["Total supplied", formatCompactCurrency(position.collateralValue)],
    ["Total borrowed", formatCompactCurrency(position.borrowValue)],
    ["Available to borrow", formatCompactCurrency(position.availableToBorrow)],
    ["Net APY", `${formatNumber(position.netApy)}%`],
    ["Collateral ratio", `${formatNumber(position.collateralRatio)}%`],
    ["Liquidation threshold", formatCompactCurrency(position.liquidationThreshold)],
  ];

  return (
    <GlassCard>
      <SectionHeader
        title="Position Summary"
        subtitle="Displays user collateral, debt, available borrow, health factor, and net yield."
      />

      <div className="space-y-3">
        {summaryItems.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4"
          >
            <div className="text-sm text-slate-400">{label}</div>
            <div className="text-lg font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <HealthFactorGauge healthFactor={position.healthFactor} />
      </div>
    </GlassCard>
  );
}
