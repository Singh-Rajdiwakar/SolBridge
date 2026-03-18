"use client";

import { Coins } from "lucide-react";

import { GlassCard } from "@/components/shared";
import type { StrategySimulationResponse } from "@/types";
import { formatCompactCurrency } from "@/utils/format";

export function RewardEstimateCard({
  data,
  loading,
}: {
  data?: StrategySimulationResponse;
  loading?: boolean;
}) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />;
  }

  return (
    <GlassCard className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Reward Estimate</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {data ? formatCompactCurrency(data.rewardEstimate.totalUsd) : "--"}
          </div>
          <div className="mt-2 text-sm text-slate-400">
            {data
              ? `${data.rewardEstimate.period} projection • ${data.rewardEstimate.totalTokensEquivalent.toFixed(2)} tokens equivalent`
              : "Reward projection appears after simulation"}
          </div>
        </div>
        <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-200">
          <Coins className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {(data?.rewardEstimate.byBucket || []).map((item) => (
          <div key={item.bucket} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.rewardTokens.toFixed(3)} {item.rewardToken}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-semibold text-white">{formatCompactCurrency(item.rewardUsd)}</div>
                <div className="mt-1 text-xs text-slate-500">{item.contributionPercent.toFixed(1)}% contribution</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
