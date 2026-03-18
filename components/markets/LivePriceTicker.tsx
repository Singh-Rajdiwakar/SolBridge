"use client";

import Image from "next/image";
import { Activity } from "lucide-react";

import type { MarketCoin } from "@/types";
import { cn } from "@/utils/cn";
import { formatRelativeTime } from "@/utils/format";

import {
  badgeTone,
  changeTone,
  formatMarketCurrency,
  formatMarketPercent,
} from "@/components/markets/utils";

export function LivePriceTicker({
  coins,
  currency,
  lastUpdated,
}: {
  coins: MarketCoin[];
  currency: string;
  lastUpdated?: string;
}) {
  const items = [...coins, ...coins];

  return (
    <div className="glass-panel overflow-hidden border-cyan-400/12 px-0 py-0">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 uppercase tracking-[0.18em]">
          <Activity className="h-3.5 w-3.5 text-cyan-300" />
          Live Market Ticker
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(34,197,94,0.8)]" />
          {lastUpdated ? `Last updated ${formatRelativeTime(lastUpdated)}` : "Streaming prices"}
        </div>
      </div>
      <div className="relative overflow-hidden py-3">
        <div className="flex min-w-max animate-[marquee_26s_linear_infinite] gap-3 px-4">
          {items.map((coin, index) => (
            <div
              key={`${coin.id}-${index}`}
              className="flex min-w-[16rem] items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2"
            >
              <Image src={coin.image} alt={coin.name} width={28} height={28} className="h-7 w-7 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{coin.symbol}</span>
                  <span className="text-xs text-slate-500">{coin.name}</span>
                </div>
                <div className="text-sm text-slate-300">{formatMarketCurrency(coin.price, currency)}</div>
              </div>
              <div
                className={cn(
                  "rounded-md border px-2 py-1 text-xs font-semibold",
                  badgeTone(coin.priceChange24h),
                  changeTone(coin.priceChange24h),
                )}
              >
                {coin.priceChange24h >= 0 ? "+" : ""}
                {formatMarketPercent(coin.priceChange24h)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
