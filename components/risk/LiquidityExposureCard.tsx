"use client";

import { Droplets } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskBreakdownResponse } from "@/types";
import { formatCurrency, formatPercent } from "@/utils/format";

export function LiquidityExposureCard({ data }: { data?: RiskBreakdownResponse }) {
  const liquidity = data?.liquidity;

  return (
    <SectionCard
      title="Liquidity Exposure"
      description="Measures impermanent-loss sensitivity, pool concentration, and total capital deployed in LPs."
      action={<Droplets className="h-4 w-4 text-violet-300" />}
    >
      {liquidity ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Score" value={`${liquidity.score}/100`} />
            <Metric label="Portfolio in Pools" value={formatPercent(liquidity.portfolioInPoolsPercent)} />
            <Metric label="IL Pressure" value={formatPercent(liquidity.estimatedImpermanentLossPressure)} />
            <Metric label="Pool Concentration" value={formatPercent(liquidity.protocolConcentrationPercent)} />
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            {liquidity.explanation}
          </div>
          <div className="space-y-3">
            {liquidity.topRiskyPools.length ? (
              liquidity.topRiskyPools.map((pool) => (
                <div key={pool.pair} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{pool.pair}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {pool.isVolatilePair ? "Volatile pair" : "Mixed pair"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-violet-200">{pool.riskIndex}/100</div>
                      <div className="mt-1 text-xs text-slate-500">{formatCurrency(pool.value)}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
                No LP positions currently contributing to risk.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          No liquidity risk data available yet.
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
