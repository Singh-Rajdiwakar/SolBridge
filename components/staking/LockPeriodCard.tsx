import { Sparkles } from "lucide-react";

import type { LockPeriod } from "@/types";
import { GradientButton } from "@/components/shared";
import { formatNumber, formatPercent } from "@/utils/format";

function estimateLockReturn(lockPeriod: LockPeriod, amount = Math.max(lockPeriod.minAmount, 100)) {
  return (amount * (lockPeriod.apy / 100) * lockPeriod.durationDays) / 365;
}

export function LockPeriodCard({
  period,
  selected,
  onClick,
  onStake,
}: {
  period: LockPeriod;
  selected?: boolean;
  onClick: () => void;
  onStake: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.75rem] border p-5 text-left transition ${
        selected
          ? "border-cyan-300/30 bg-cyan-400/10 shadow-neon"
          : "border-white/10 bg-white/[0.03] hover:border-cyan-300/20 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-400">{period.label}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatPercent(period.apy)}</div>
        </div>
        <Sparkles className="h-5 w-5 text-cyan-300" />
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-400">
        <div className="flex justify-between">
          <span>Estimated return</span>
          <span className="text-white">{formatNumber(estimateLockReturn(period), 4)}</span>
        </div>
        <div className="flex justify-between">
          <span>Minimum stake</span>
          <span className="text-white">{period.minAmount}</span>
        </div>
      </div>
      <GradientButton className="mt-5 w-full" onClick={onStake}>
        Stake Now
      </GradientButton>
    </button>
  );
}
