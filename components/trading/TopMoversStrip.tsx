"use client";

import type { TradingTickerResponse } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

export function TopMoversStrip({ ticker }: { ticker?: TradingTickerResponse }) {
  const items = [
    ...(ticker?.topGainers || []).slice(0, 2),
    ...(ticker?.topLosers || []).slice(0, 2),
    ...(ticker?.highestVolume || []).slice(0, 2),
  ];

  return (
    <div className="glass-panel overflow-hidden border-white/8 px-0 py-0">
      <div className="flex overflow-x-auto">
        {items.map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="min-w-[16rem] border-r border-white/8 px-4 py-3 last:border-r-0"
          >
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {index < 2 ? "Top Gainer" : index < 4 ? "Top Loser" : "Highest Volume"}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-white">{item.baseAsset}</div>
                <div className="text-xs text-slate-500">{formatCompactCurrency(item.lastPrice)}</div>
              </div>
              <div className={item.priceChangePercent >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {formatPercent(item.priceChangePercent)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
