"use client";

import { AlertTriangle, Landmark } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskBreakdownResponse } from "@/types";
import { formatPercent } from "@/utils/format";

export function BorrowExposureCard({ data }: { data?: RiskBreakdownResponse }) {
  const borrow = data?.borrow;

  return (
    <SectionCard
      title="Borrow Exposure"
      description="Health factor, debt-to-collateral ratio, and liquidation sensitivity for current lending activity."
      action={<Landmark className="h-4 w-4 text-amber-300" />}
    >
      {borrow ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Score" value={`${borrow.score}/100`} />
            <Metric label="Health Factor" value={borrow.healthFactor?.toFixed(2) || "--"} />
            <Metric label="Debt Ratio" value={formatPercent(borrow.debtToCollateralRatio)} />
            <Metric label="Borrow Share" value={formatPercent(borrow.borrowedShare)} />
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Liquidation Warning</div>
                <div className="mt-2 text-lg font-semibold text-white">{borrow.liquidationWarningLevel}</div>
              </div>
              <AlertTriangle className={`h-5 w-5 ${borrow.score <= 35 ? "text-emerald-300" : borrow.score <= 65 ? "text-amber-300" : "text-rose-300"}`} />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/6">
              <div
                className={`h-full rounded-full ${borrow.score <= 35 ? "bg-emerald-400" : borrow.score <= 65 ? "bg-amber-400" : "bg-rose-400"}`}
                style={{ width: `${borrow.score}%` }}
              />
            </div>
            <div className="mt-3 text-sm text-slate-300">{borrow.explanation}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{borrow.recommendedSafeZone}</div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Borrow analytics will appear after a wallet with lending activity is detected.
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
