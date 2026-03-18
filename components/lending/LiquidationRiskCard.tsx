import { AlertTriangle } from "lucide-react";

import { GlassCard, StatusBadge } from "@/components/shared";
import { formatNumber } from "@/utils/format";

function getRiskStatus(healthFactor: number) {
  if (healthFactor >= 2) return "safe";
  if (healthFactor >= 1.5) return "moderate";
  if (healthFactor >= 1.1) return "risky";
  return "danger";
}

export function LiquidationRiskCard({
  healthFactor,
  collateralRatio,
  warningText,
}: {
  healthFactor: number;
  collateralRatio: number;
  warningText?: string;
}) {
  const status = getRiskStatus(healthFactor);

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <AlertTriangle className="h-4 w-4 text-cyan-300" />
            Liquidation Risk
          </div>
          <div className="mt-3 text-2xl font-semibold capitalize text-white">{status}</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {warningText || "Track health factor and collateral ratio before increasing leverage."}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Health factor</div>
          <div className="mt-3 text-xl font-semibold text-white">{formatNumber(healthFactor)}</div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Collateral ratio</div>
          <div className="mt-3 text-xl font-semibold text-white">{formatNumber(collateralRatio)}%</div>
        </div>
      </div>
    </GlassCard>
  );
}
