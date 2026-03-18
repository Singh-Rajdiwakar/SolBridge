"use client";

import { PieChart } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskBreakdownResponse } from "@/types";
import { formatPercent } from "@/utils/format";

export function ConcentrationRiskCard({ data }: { data?: RiskBreakdownResponse }) {
  const concentration = data?.concentration;

  return (
    <SectionCard
      title="Concentration Risk"
      description="Highlights how much of the portfolio is clustered in a single asset or a narrow group of holdings."
      action={<PieChart className="h-4 w-4 text-rose-300" />}
    >
      {concentration ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Score" value={`${concentration.score}/100`} />
            <Metric label="Largest Asset" value={formatPercent(concentration.largestAssetPercent)} />
            <Metric label="Top 3 Assets" value={formatPercent(concentration.top3AssetsPercent)} />
            <Metric label="Diversification" value={concentration.diversificationLabel} />
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            {concentration.explanation}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Concentration risk will populate after holdings are available.
        </div>
      )}
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
