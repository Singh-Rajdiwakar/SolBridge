import type { LockPeriod } from "@/types";

import { GradientButton, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/utils/format";

export function LockPeriodAdminRow({
  period,
  onEdit,
  onDelete,
  onToggle,
}: {
  period: LockPeriod;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-lg font-semibold text-white">{period.label}</div>
        <div className="mt-1 text-sm text-slate-400">
          {period.durationDays} days · APY {formatNumber(period.apy)}% · Min {formatNumber(period.minAmount)} · Penalty {formatNumber(period.penaltyFee)}%
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={period.enabled ? "active" : "paused"} />
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="secondary" size="sm" onClick={onToggle}>
          Toggle
        </Button>
        <GradientButton variant="danger" onClick={onDelete}>
          Delete
        </GradientButton>
      </div>
    </div>
  );
}
