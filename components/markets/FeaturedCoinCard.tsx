"use client";

import Image from "next/image";
import { Eye, Star } from "lucide-react";

import type { MarketCoin } from "@/types";
import { Button } from "@/components/ui/button";
import { MiniSparkline } from "@/components/markets/MiniSparkline";
import {
  badgeTone,
  formatMarketCompactCurrency,
  formatMarketCurrency,
  formatMarketPercent,
} from "@/components/markets/utils";
import { cn } from "@/utils/cn";

export function FeaturedCoinCard({
  coin,
  currency,
  watched,
  onViewChart,
  onToggleWatchlist,
}: {
  coin: MarketCoin;
  currency: string;
  watched?: boolean;
  onViewChart: (coinId: string) => void;
  onToggleWatchlist: (coinId: string) => void;
}) {
  return (
    <div className="glass-panel group border-white/8 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src={coin.image} alt={coin.name} width={44} height={44} className="h-11 w-11 rounded-full ring-1 ring-white/10" />
          <div>
            <div className="text-lg font-semibold text-white">{coin.name}</div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{coin.symbol}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleWatchlist(coin.id)}
          className={cn(
            "rounded-md border p-2 text-slate-400 transition hover:text-white",
            watched ? "border-amber-300/30 bg-amber-500/10 text-amber-300" : "border-white/10 bg-white/[0.03]",
          )}
        >
          <Star className="h-4 w-4" fill={watched ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Current Price</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {formatMarketCurrency(coin.price, currency)}
          </div>
        </div>
        <div className={cn("rounded-md border px-3 py-1.5 text-sm font-semibold", badgeTone(coin.priceChange24h))}>
          {coin.priceChange24h >= 0 ? "+" : ""}
          {formatMarketPercent(coin.priceChange24h)}
        </div>
      </div>

      <div className="mt-4">
        <MiniSparkline data={coin.sparkline} positive={coin.priceChange24h >= 0} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Market Cap</div>
          <div className="mt-1 font-medium text-slate-200">
            {formatMarketCompactCurrency(coin.marketCap, currency)}
          </div>
        </div>
        <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h Volume</div>
          <div className="mt-1 font-medium text-slate-200">
            {formatMarketCompactCurrency(coin.totalVolume, currency)}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={() => onViewChart(coin.id)} className="flex-1">
          <Eye className="h-4 w-4" />
          View Chart
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => onToggleWatchlist(coin.id)}>
          <Star className="h-4 w-4" />
          {watched ? "Watched" : "Watchlist"}
        </Button>
      </div>
    </div>
  );
}
