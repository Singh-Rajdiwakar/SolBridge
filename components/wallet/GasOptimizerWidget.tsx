"use client";

import type { ReactNode } from "react";
import { Clock3, Gauge, Zap } from "lucide-react";

import { GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import type { GasOptimizationResponse } from "@/types";
import { formatNumber } from "@/utils/format";

export function GasOptimizerWidget({
  optimization,
  loading,
}: {
  optimization?: GasOptimizationResponse;
  loading?: boolean;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Gas Optimizer"
        subtitle="Current fee pressure, timing suggestions, and confirmation estimates."
        action={<Gauge className="h-4 w-4 text-cyan-300" />}
      />

      {loading || !optimization ? (
        <LoadingSkeleton type="card" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Current Fee" value={`${formatNumber(optimization.currentFee, 6)} SOL`} icon={<Zap className="h-4 w-4 text-cyan-300" />} />
            <Metric label="Recommended Fee" value={`${formatNumber(optimization.recommendedFee, 6)} SOL`} icon={<Clock3 className="h-4 w-4 text-cyan-300" />} />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Congestion Level</div>
                <div className="mt-2 text-2xl font-semibold text-white">{optimization.congestionLevel}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-emerald-300">{optimization.estimatedSavings}% savings</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {optimization.estimatedConfirmationTime}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm leading-6 text-slate-400">{optimization.recommendation}</div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
        {icon}
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
