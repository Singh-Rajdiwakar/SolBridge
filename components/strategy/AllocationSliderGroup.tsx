"use client";

import { AlertTriangle } from "lucide-react";

import { STRATEGY_BUCKET_META } from "@/components/strategy/strategy-config";
import { SectionCard } from "@/components/dashboard/section-card";
import type { StrategyDraftState } from "@/hooks/useStrategyBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

export function AllocationSliderGroup({
  draft,
  allocationTotal,
  onAllocationChange,
  onCapitalChange,
  onAssumptionChange,
  onReset,
}: {
  draft: StrategyDraftState;
  allocationTotal: number;
  onAllocationChange: (key: keyof StrategyDraftState["allocations"], value: number) => void;
  onCapitalChange: (value: number) => void;
  onAssumptionChange: (key: keyof NonNullable<StrategyDraftState["assumptions"]>, value: string) => void;
  onReset: () => void;
}) {
  const assumptions = draft.assumptions || {};

  return (
    <SectionCard
      title="Allocation Builder"
      description="Define the DeFi mix across staking, liquidity, lending, hold, governance, and stable reserves. Total allocation must equal 100%."
      action={
        <Button variant="secondary" size="sm" onClick={onReset}>
          Reset Mix
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[1fr_240px]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Strategy Name</div>
            <div className="mt-2 text-xl font-semibold text-white">{draft.name}</div>
            <div className="mt-1 text-sm text-slate-400">Draft title updates when you load presets or save a named strategy.</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Portfolio Capital</div>
            <Input
              className="mt-3"
              type="number"
              min={100}
              step={100}
              value={draft.portfolioCapital}
              onChange={(event) => onCapitalChange(Number(event.target.value || 0))}
            />
            <div className="mt-2 text-xs text-slate-500">Used as the simulation base for projected growth and rewards.</div>
          </div>
        </div>

        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
            allocationTotal === 100
              ? "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-100"
              : "border-amber-400/20 bg-amber-500/[0.08] text-amber-100",
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-medium">
              Allocation total {allocationTotal === 100 ? "is valid" : "needs adjustment"}: {allocationTotal.toFixed(2)}%
            </div>
            <div className="mt-1 text-xs text-current/80">
              {allocationTotal === 100
                ? "Simulation, comparison, and save flows are active."
                : "Increase or reduce one or more buckets until the strategy totals 100%."}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {STRATEGY_BUCKET_META.map((bucket) => (
            <div
              key={bucket.key}
              className={cn(
                "rounded-xl border border-white/10 bg-gradient-to-r p-4",
                bucket.accent,
              )}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{bucket.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-400">{bucket.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-white">{draft.allocations[bucket.key].toFixed(2)}%</div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Allocation</div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={draft.allocations[bucket.key]}
                    onChange={(event) => onAllocationChange(bucket.key, Number(event.target.value))}
                    className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
                  />
                </div>
                <div className="w-full lg:w-36">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={draft.allocations[bucket.key]}
                    onChange={(event) => onAllocationChange(bucket.key, Number(event.target.value || 0))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm font-semibold text-white">Bucket Assumptions</div>
          <div className="mt-1 text-xs text-slate-500">These labels document the assets and pairs the strategy is centered around.</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              { key: "stakingToken", label: "Staking Token", value: assumptions.stakingToken || "" },
              { key: "liquidityPair", label: "Liquidity Pair", value: assumptions.liquidityPair || "" },
              { key: "lendingAsset", label: "Lending Asset", value: assumptions.lendingAsset || "" },
              { key: "governanceToken", label: "Governance Token", value: assumptions.governanceToken || "" },
              { key: "stableAsset", label: "Stable Asset", value: assumptions.stableAsset || "" },
            ].map((entry) => (
              <div key={entry.key} className="space-y-2">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{entry.label}</div>
                <Input
                  value={entry.value}
                  onChange={(event) => onAssumptionChange(entry.key as keyof NonNullable<StrategyDraftState["assumptions"]>, event.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
