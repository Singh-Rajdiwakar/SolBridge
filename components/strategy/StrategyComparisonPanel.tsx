"use client";

import { CheckCircle2, GitCompareArrows, Trash2 } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { StrategyComparisonResponse, StrategyPlanRecord } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

export function StrategyComparisonPanel({
  strategies,
  selectedIds,
  onToggle,
  onLoad,
  onDelete,
  comparison,
  comparisonLoading,
}: {
  strategies: StrategyPlanRecord[];
  selectedIds: string[];
  onToggle: (strategyId: string) => void;
  onLoad: (strategy: StrategyPlanRecord) => void;
  onDelete: (strategyId: string) => void;
  comparison?: StrategyComparisonResponse;
  comparisonLoading?: boolean;
}) {
  return (
    <SectionCard
      title="Strategy Comparison"
      description="Save named strategies, compare them against the current draft, and identify the best yield or lowest risk profile."
      action={
        <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          <GitCompareArrows className="h-4 w-4 text-cyan-300" />
          Current draft included automatically
        </div>
      }
    >
      <div className="space-y-5">
        {strategies.length ? (
          <div className="grid gap-3">
            {strategies.map((strategy) => {
              const active = selectedIds.includes(strategy._id);
              return (
                <div key={strategy._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{strategy.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {strategy.timeframe} • {strategy.scenario} • {formatCompactCurrency(strategy.portfolioCapital)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant={active ? "default" : "secondary"} size="sm" onClick={() => onToggle(strategy._id)}>
                        {active ? <CheckCircle2 className="h-4 w-4" /> : null}
                        {active ? "Selected" : "Compare"}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => onLoad(strategy)}>
                        Load
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onDelete(strategy._id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6">
            <EmptyState
              title="No saved strategies yet"
              description="Save a few DeFi allocation plans to compare risk, yield, and projected growth side by side."
            />
          </div>
        )}

        {comparisonLoading ? (
          <div className="h-48 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
        ) : comparison ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-emerald-400/15 bg-emerald-500/[0.08] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Best Yield</div>
                <div className="mt-2 text-lg font-semibold text-white">{comparison.highlights.bestYield}</div>
              </div>
              <div className="rounded-lg border border-cyan-400/15 bg-cyan-500/[0.08] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Lowest Risk</div>
                <div className="mt-2 text-lg font-semibold text-white">{comparison.highlights.lowestRisk}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Balanced Profile</div>
                <div className="mt-2 text-lg font-semibold text-white">{comparison.highlights.balancedProfile}</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Strategy</th>
                    <th className="px-4 py-3 font-medium">Annual Yield</th>
                    <th className="px-4 py-3 font-medium">Projected Value</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                    <th className="px-4 py-3 font-medium">Volatility</th>
                    <th className="px-4 py-3 font-medium">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.strategies.map((item) => (
                    <tr key={`${item.name}-${item.timeframe}-${item.scenario}`} className="border-t border-white/8">
                      <td className="px-4 py-3 text-white">
                        <div className="font-medium">{item.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.timeframe} • {item.scenario}</div>
                      </td>
                      <td className="px-4 py-3 text-emerald-300">{formatPercent(item.annualYieldPercent, 2)}</td>
                      <td className="px-4 py-3 text-white">{formatCompactCurrency(item.projectedTotalValue)}</td>
                      <td className="px-4 py-3 text-white">{item.riskScore.toFixed(1)} • {item.riskLabel}</td>
                      <td className="px-4 py-3 text-white">{item.volatilityScore.toFixed(1)} • {item.volatilityLabel}</td>
                      <td className="px-4 py-3 text-slate-300">{item.balanceProfile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
            Select one or more saved strategies to compare them against the current draft.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
