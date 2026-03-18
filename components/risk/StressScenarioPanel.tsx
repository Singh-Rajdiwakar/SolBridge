"use client";

import { Sparkles } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import type { RiskStressTestResponse } from "@/types";
import { formatCurrency, formatPercent } from "@/utils/format";

export function StressScenarioPanel({
  data,
  pending,
  onRun,
}: {
  data?: RiskStressTestResponse;
  pending?: boolean;
  onRun: () => void;
}) {
  return (
    <SectionCard
      title="Stress Scenario Testing"
      description="Replay downside and defensive scenarios to see how score, health factor, and projected value change."
      action={<Sparkles className="h-4 w-4 text-cyan-300" />}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button onClick={onRun} disabled={pending}>
            <Sparkles className="h-4 w-4" />
            {pending ? "Simulating..." : "Run Scenario"}
          </Button>
        </div>

        {data ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Baseline</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Metric label="Risk Score" value={`${data.baseline.totalRiskScore}/100`} />
                <Metric label="Portfolio Value" value={formatCurrency(data.baseline.projectedPortfolioValue)} />
                <Metric label="Health Factor" value={data.baseline.healthFactor?.toFixed(2) || "--"} />
                <Metric label="Risk Label" value={data.baseline.riskLabel} />
              </div>
            </div>

            <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/[0.05] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Scenario Result</div>
              <div className="mt-2 text-lg font-semibold text-white">{data.scenario.label}</div>
              <div className="mt-1 text-sm text-slate-400">{data.scenario.description}</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric label="Risk Score" value={`${data.result.totalRiskScore}/100`} />
                <Metric label="Projected Value" value={formatCurrency(data.result.projectedPortfolioValue)} />
                <Metric label="PnL Impact" value={formatPercent(data.result.pnlImpactPercent)} />
                <Metric label="Health Factor" value={data.result.healthFactor?.toFixed(2) || "--"} />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
            Select a scenario in the header and run a simulation to inspect stress sensitivity.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
