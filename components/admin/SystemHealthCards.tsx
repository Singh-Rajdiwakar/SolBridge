import type { SystemHealth } from "@/types";

import { GlassCard, SectionHeader } from "@/components/shared";
import { formatCompactCurrency, formatNumber } from "@/utils/format";

export function SystemHealthCards({ health }: { health: SystemHealth }) {
  return (
    <GlassCard>
      <SectionHeader title="Pool Health Monitor" subtitle="Displays platform health metrics like total locked liquidity and pending claims." />
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Total locked liquidity", formatCompactCurrency(health.totalLockedLiquidity)],
          ["Active users", formatNumber(health.activeUsers)],
          ["Pending claims", formatNumber(health.pendingClaims, 4)],
          ["Rewards distributed", formatCompactCurrency(health.totalRewardsDistributed)],
          ["Utilization", `${formatNumber(health.utilization)}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</div>
            <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
