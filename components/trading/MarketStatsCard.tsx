"use client";

import type { TradingMarketStats } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

export function MarketStatsCard({ stats }: { stats?: TradingMarketStats }) {
  return (
    <div className="glass-panel space-y-4 border-white/8 p-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Market Stats</div>
        <div className="mt-2 text-lg font-semibold text-white">{stats?.name || "Selected coin"}</div>
      </div>
      <div className="grid gap-3">
        {[
          ["Market Cap", stats ? formatCompactCurrency(stats.marketCap) : "--"],
          ["Circulating Supply", stats ? stats.circulatingSupply.toLocaleString() : "--"],
          ["24h Volume", stats ? formatCompactCurrency(stats.quoteVolume) : "--"],
          ["ATH", stats ? formatCompactCurrency(stats.ath) : "--"],
          ["ATL", stats ? formatCompactCurrency(stats.atl) : "--"],
          ["Trend", stats?.trend || "--"],
          ["Volatility", stats ? formatPercent(stats.volatilityScore) : "--"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="font-medium text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
