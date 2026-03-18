"use client";

import { useForm } from "react-hook-form";

import type { RewardCalculationInput, RewardCalculationResult } from "@/types";
import { GradientButton, GlassCard, SectionHeader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/utils/format";

export function RewardsCalculatorCard({
  apyOptions,
  durationOptions,
  onCalculate,
  result,
}: {
  apyOptions: number[];
  durationOptions: number[];
  onCalculate: (payload: RewardCalculationInput) => void;
  result?: RewardCalculationResult;
}) {
  const form = useForm<RewardCalculationInput>({
    defaultValues: {
      amount: 150,
      durationDays: durationOptions[0] || 30,
      apy: apyOptions[0] || 12.4,
    },
  });

  return (
    <GlassCard>
      <SectionHeader
        title="Rewards Calculator"
        subtitle="Interactive calculator for estimating rewards."
      />
      <form className="space-y-4" onSubmit={form.handleSubmit(onCalculate)}>
        <div className="space-y-2">
          <Label htmlFor="calcAmount">Amount</Label>
          <Input id="calcAmount" type="number" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calcDuration">Duration</Label>
          <Input id="calcDuration" type="number" {...form.register("durationDays", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calcApy">APY</Label>
          <Input id="calcApy" type="number" step="0.01" {...form.register("apy", { valueAsNumber: true })} />
        </div>
        <GradientButton type="submit" className="w-full">
          Calculate
        </GradientButton>
      </form>

      <div className="mt-5 grid gap-3">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Estimated reward</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {result ? formatNumber(result.estimatedReward, 6) : "--"}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Projected value</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {result ? formatNumber(result.projectedValue, 6) : "--"}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
