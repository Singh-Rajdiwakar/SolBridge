"use client";

import { Activity } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskBreakdownResponse } from "@/types";
import { formatPercent } from "@/utils/format";

export function VolatilityRiskCard({ data }: { data?: RiskBreakdownResponse }) {
  return (
    <SectionCard
      title="Asset Volatility Risk"
      description="Tracks the share of portfolio value exposed to volatile tokens and recent market movement."
      action={<Activity className="h-4 w-4 text-cyan-300" />}
    >
      {data ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Score" value={`${data.volatility.score}/100`} />
            <Metric label="Stable Ratio" value={formatPercent(data.volatility.stablecoinRatio)} />
            <Metric label="Risk Level" value={data.volatility.label} />
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            {data.volatility.explanation}
          </div>
          <div className="space-y-3">
            {data.volatility.topVolatileAssets.map((asset) => (
              <div key={asset.symbol} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{asset.symbol}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {formatPercent(asset.allocationPercent)} allocation
                    </div>
                  </div>
                  <div className="text-sm font-medium text-cyan-200">{asset.volatilityScore}/100</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Connect a wallet to measure volatility contribution across tracked assets.
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
