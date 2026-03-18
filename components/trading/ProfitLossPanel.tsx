"use client";

import type { TradingMarketStats, TradingSimulationResponse } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

export function ProfitLossPanel({
  stats,
  simulation,
}: {
  stats?: TradingMarketStats;
  simulation?: TradingSimulationResponse;
}) {
  return (
    <div className="glass-panel space-y-4 border-white/8 p-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Profit / Loss</div>
        <div className="mt-2 text-lg font-semibold text-white">Advanced trade analytics</div>
      </div>
      <div className="grid gap-3">
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Current Price</div>
          <div className="mt-1 text-lg font-semibold text-white">{stats ? formatCompactCurrency(stats.lastPrice) : "--"}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Unrealized P&amp;L</div>
          <div className={`mt-1 text-lg font-semibold ${(simulation?.unrealizedPnl || 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {simulation ? formatCompactCurrency(simulation.unrealizedPnl) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">ROI %</div>
          <div className={`mt-1 text-lg font-semibold ${(simulation?.roiPercent || 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {simulation ? formatPercent(simulation.roiPercent) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Best Case</div>
          <div className="mt-1 text-lg font-semibold text-emerald-300">
            {simulation ? formatCompactCurrency(simulation.estimatedProfit) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Stop Loss Scenario</div>
          <div className="mt-1 text-lg font-semibold text-rose-300">
            {simulation ? formatCompactCurrency(simulation.estimatedLoss) : "--"}
          </div>
        </div>
      </div>
    </div>
  );
}
