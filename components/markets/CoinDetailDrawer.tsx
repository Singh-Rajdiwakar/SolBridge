"use client";

import Image from "next/image";
import { ExternalLink, Star } from "lucide-react";

import type { MarketChartResponse, MarketCoinDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMarketCompactCurrency, formatMarketCurrency, formatMarketPercent, sentimentTone } from "@/components/markets/utils";
import { formatDate } from "@/utils/format";

export function CoinDetailDrawer({
  coin,
  chart,
  currency,
  open,
  watched,
  onOpenChange,
  onToggleWatchlist,
}: {
  coin?: MarketCoinDetail | null;
  chart?: MarketChartResponse;
  currency: string;
  open: boolean;
  watched?: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleWatchlist: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,72rem)]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {coin?.image ? <Image src={coin.image} alt={coin.name} width={48} height={48} className="h-12 w-12 rounded-full" /> : null}
              <div>
                <DialogTitle>{coin?.name || "Coin detail"}</DialogTitle>
                <DialogDescription>
                  {coin?.symbol} • Last updated {coin?.lastUpdated ? formatDate(coin.lastUpdated) : "--"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onToggleWatchlist}>
                <Star className="h-4 w-4" fill={watched ? "currentColor" : "none"} />
                {watched ? "Watching" : "Watchlist"}
              </Button>
              {coin?.explorers?.[0] ? (
                <a href={coin.explorers[0]} target="_blank" rel="noreferrer">
                  <Button variant="secondary">
                    <ExternalLink className="h-4 w-4" />
                    Market Link
                  </Button>
                </a>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        {coin ? (
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Live Price</div>
                  <div className="mt-1 text-lg font-semibold text-white">{formatMarketCurrency(coin.price, currency)}</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h Change</div>
                  <div className="mt-1 text-lg font-semibold text-white">{formatMarketPercent(coin.priceChange24h)}</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Sentiment</div>
                  <div className={`mt-1 inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${sentimentTone(coin.sentiment)}`}>
                    {coin.sentiment}
                  </div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Market Cap</div>
                  <div className="mt-1 text-lg font-semibold text-white">{formatMarketCompactCurrency(coin.marketCap, currency)}</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Volume</div>
                  <div className="mt-1 text-lg font-semibold text-white">{formatMarketCompactCurrency(coin.totalVolume, currency)}</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Supply</div>
                  <div className="mt-1 text-lg font-semibold text-white">{formatMarketCompactCurrency(coin.circulatingSupply, currency)}</div>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                {coin.description
                  ? `${coin.description.replace(/<[^>]+>/g, "").slice(0, 420)}...`
                  : "Live crypto asset description is unavailable for this market."}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Performance Snapshot</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-300"><span>ATH</span><span>{formatMarketCurrency(coin.ath, currency)}</span></div>
                  <div className="flex items-center justify-between text-slate-300"><span>ATL</span><span>{formatMarketCurrency(coin.atl, currency)}</span></div>
                  <div className="flex items-center justify-between text-slate-300"><span>24h Range</span><span>{formatMarketCurrency(coin.low24h, currency)} - {formatMarketCurrency(coin.high24h, currency)}</span></div>
                  <div className="flex items-center justify-between text-slate-300"><span>7d Change</span><span>{formatMarketPercent(coin.priceChange7d)}</span></div>
                  <div className="flex items-center justify-between text-slate-300"><span>Explorer</span><span>{coin.explorers?.[0] ? "Available" : "Unavailable"}</span></div>
                  <div className="flex items-center justify-between text-slate-300"><span>Chart Points</span><span>{chart?.points.length || 0}</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
