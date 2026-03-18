"use client";

import { Download, RefreshCcw, ShieldAlert } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { FilterTabs } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RiskRange, RiskScenario } from "@/types";

const RANGE_ITEMS: Array<{ label: string; value: RiskRange }> = [
  { label: "7D", value: "7D" },
  { label: "30D", value: "30D" },
  { label: "90D", value: "90D" },
  { label: "1Y", value: "1Y" },
];

const SCENARIO_ITEMS: Array<{ label: string; value: RiskScenario }> = [
  { label: "SOL -10%", value: "sol-drop-10" },
  { label: "SOL -20%", value: "sol-drop-20" },
  { label: "LP Divergence", value: "lp-divergence-15" },
  { label: "Debt +10%", value: "borrowed-asset-up-10" },
  { label: "Stable Buffer", value: "stable-buffer" },
];

export function RiskEngineHeader({
  range,
  scenario,
  onRangeChange,
  onScenarioChange,
  onRefresh,
  onExport,
  loading,
}: {
  range: RiskRange;
  scenario: RiskScenario;
  onRangeChange: (value: RiskRange) => void;
  onScenarioChange: (value: RiskScenario) => void;
  onRefresh: () => void;
  onExport: () => void;
  loading?: boolean;
}) {
  return (
    <SectionCard
      title="Risk Management Engine"
      description="Cross-protocol portfolio safety scoring powered by wallet allocations, lending health, liquidity exposure, and market volatility inputs."
      action={<ShieldAlert className="h-4 w-4 text-cyan-300" />}
      className="overflow-hidden"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Portfolio Safety Console</div>
          <div className="text-sm text-slate-300">
            Monitor risk drift, simulate stress scenarios, and inspect the main contributors pushing your portfolio
            into safer or riskier territory.
          </div>
        </div>

        <FilterTabs
          items={RANGE_ITEMS}
          active={range}
          onChange={(value) => onRangeChange(value as RiskRange)}
        />

        <div className="min-w-[180px]">
          <Select value={scenario} onValueChange={(value) => onScenarioChange(value as RiskScenario)}>
            <SelectTrigger>
              <SelectValue placeholder="Stress scenario" />
            </SelectTrigger>
            <SelectContent>
              {SCENARIO_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onRefresh} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={onExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
