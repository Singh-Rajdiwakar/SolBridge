"use client";

import Image from "next/image";
import type { MarketCoin } from "@/types";

import { formatMarketCurrency, formatMarketPercent } from "@/components/markets/utils";

export function TopLosersCard({
  items,
  currency,
}: {
  items: MarketCoin[];
  currency: string;
}) {
  return (
    <div className="glass-panel border-rose-400/12 p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Top Losers</div>
      <div className="mt-2 text-xl font-semibold text-white">Weakest 24h performers</div>
      <div className="mt-5 space-y-3">
        {items.map((coin) => (
          <div key={coin.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center gap-3">
              <Image src={coin.image} alt={coin.name} width={32} height={32} className="h-8 w-8 rounded-full" />
              <div>
                <div className="font-medium text-white">{coin.symbol}</div>
                <div className="text-xs text-slate-500">{formatMarketCurrency(coin.price, currency)}</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-rose-300">
              -{formatMarketPercent(Math.abs(coin.priceChange24h))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
