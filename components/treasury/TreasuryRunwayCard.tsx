import { Clock3 } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { TreasuryRunwayResponse } from "@/types";
import { formatCompactCurrency } from "@/utils/format";

export function TreasuryRunwayCard({ data }: { data?: TreasuryRunwayResponse }) {
  return (
    <SectionCard title="Treasury Runway Estimator" description="How long current reserves can cover expected commitments.">
      {!data?.configured ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center text-sm text-slate-400">
          Runway becomes available once treasury wallets and monthly commitments are configured.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Stable reserve runway", `${data.stableReserveRunwayMonths} months`],
              ["Total reserve runway", `${data.totalReserveRunwayMonths} months`],
              ["Monthly outflow", formatCompactCurrency(data.monthlyOutflowEstimate || 0)],
              ["Rewards funding", formatCompactCurrency(data.rewardFundingMonthly || 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
                <div className="mt-2 text-lg font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-cyan-400/15 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            <div className="flex items-center gap-2 font-medium">
              <Clock3 className="h-4 w-4" />
              Runway note
            </div>
            <div className="mt-1">{data.warning}</div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
