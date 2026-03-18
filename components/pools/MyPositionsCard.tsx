import type { LiquidityPosition } from "@/types";

import { EmptyState, GlassCard, SectionHeader } from "@/components/shared";
import { formatCurrency, formatNumber } from "@/utils/format";

export function MyPositionsCard({
  positions,
  onManage,
}: {
  positions: LiquidityPosition[];
  onManage: (positionId: string) => void;
}) {
  return (
    <GlassCard>
      <SectionHeader title="My Active Positions" subtitle="Shows user’s active LP positions." />
      {positions.length > 0 ? (
        <div className="space-y-3">
          {positions.map((position) => (
            <button
              type="button"
              key={position._id}
              className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-left"
              onClick={() => onManage(position._id)}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">{position.pair}</div>
                  <div className="text-sm text-slate-400">
                    Deposited {formatNumber(position.amountA)} / {formatNumber(position.amountB)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">{formatNumber(position.lpTokens)} LP</div>
                  <div className="text-sm text-cyan-200">Fees {formatCurrency(position.feesEarned)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="No LP positions" description="Use the simulation panel to add liquidity to your first pool." />
      )}
    </GlassCard>
  );
}
