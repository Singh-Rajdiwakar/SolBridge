"use client";

import { Download, RefreshCw, RotateCcw, Save } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { STRATEGY_SCENARIO_OPTIONS, STRATEGY_TIMEFRAME_OPTIONS } from "@/components/strategy/strategy-config";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StrategyScenario, StrategyTimeframe } from "@/types";
import { formatCompactCurrency } from "@/utils/format";

export function StrategyBuilderHeader({
  timeframe,
  onTimeframeChange,
  scenario,
  onScenarioChange,
  allocationTotal,
  portfolioCapital,
  onRefresh,
  onReset,
  onSave,
  onExport,
  loading,
}: {
  timeframe: StrategyTimeframe;
  onTimeframeChange: (value: StrategyTimeframe) => void;
  scenario: StrategyScenario;
  onScenarioChange: (value: StrategyScenario) => void;
  allocationTotal: number;
  portfolioCapital: number;
  onRefresh: () => void;
  onReset: () => void;
  onSave: () => void;
  onExport: () => void;
  loading: boolean;
}) {
  const scenarioMeta = STRATEGY_SCENARIO_OPTIONS.find((item) => item.value === scenario);

  return (
    <SectionCard
      title="Strategy Builder Controls"
      description="Build a weighted DeFi allocation, run protocol-aware return simulations, and compare saved strategies without leaving the analytics stack."
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button size="sm" onClick={onSave}>
            <Save className="h-4 w-4" />
            Save Strategy
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Timeframe</div>
          <div className="mt-3">
            <Select value={timeframe} onValueChange={(value) => onTimeframeChange(value as StrategyTimeframe)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGY_TIMEFRAME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Scenario Mode</div>
          <div className="mt-3">
            <Select value={scenario} onValueChange={(value) => onScenarioChange(value as StrategyScenario)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGY_SCENARIO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 text-xs text-slate-500">{scenarioMeta?.helper}</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-cyan-400/15 bg-cyan-500/[0.06] p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Allocation Total</div>
            <div className={`mt-3 text-2xl font-semibold ${allocationTotal === 100 ? "text-emerald-300" : "text-amber-300"}`}>
              {allocationTotal.toFixed(2)}%
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {allocationTotal === 100 ? "Simulation ready" : "Total must equal 100%"}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Portfolio Capital</div>
            <div className="mt-3 text-2xl font-semibold text-white">{formatCompactCurrency(portfolioCapital || 0)}</div>
            <div className="mt-2 text-sm text-slate-400">Simulation base capital</div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
