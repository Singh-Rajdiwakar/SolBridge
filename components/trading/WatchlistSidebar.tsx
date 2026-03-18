"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";

import type { TradingSymbol, TradingTickerItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCompactCurrency, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

export function WatchlistSidebar({
  items,
  selectedSymbol,
  watchlistSymbols,
  onSelect,
  onToggleWatchlist,
}: {
  items: TradingTickerItem[];
  selectedSymbol: TradingSymbol;
  watchlistSymbols: TradingSymbol[];
  onSelect: (symbol: TradingSymbol) => void;
  onToggleWatchlist: (symbol: TradingSymbol) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"default" | "gainers" | "losers">("default");

  const filtered = useMemo(() => {
    const base = items.filter((item) => {
      const search = query.toLowerCase();
      return item.baseAsset.toLowerCase().includes(search) || item.name.toLowerCase().includes(search);
    });
    if (sortMode === "gainers") {
      return [...base].sort((a, b) => b.priceChangePercent - a.priceChangePercent);
    }
    if (sortMode === "losers") {
      return [...base].sort((a, b) => a.priceChangePercent - b.priceChangePercent);
    }
    return base;
  }, [items, query, sortMode]);

  return (
    <div className="glass-panel space-y-4 border-white/8 p-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Live Watchlist</div>
        <div className="mt-2 text-lg font-semibold text-white">Market terminal</div>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder="Search coin" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={sortMode === "default" ? "default" : "secondary"} onClick={() => setSortMode("default")}>All</Button>
        <Button size="sm" variant={sortMode === "gainers" ? "default" : "secondary"} onClick={() => setSortMode("gainers")}>Gainers</Button>
        <Button size="sm" variant={sortMode === "losers" ? "default" : "secondary"} onClick={() => setSortMode("losers")}>Losers</Button>
      </div>
      <div className="space-y-2">
        {filtered.map((item) => (
          <button
            type="button"
            key={item.symbol}
            onClick={() => onSelect(item.symbol)}
            className={cn(
              "w-full rounded-md border px-3 py-3 text-left transition",
              selectedSymbol === item.symbol
                ? "border-cyan-300/30 bg-cyan-500/10"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
            )}
          >
            <div className="flex items-center gap-3">
              {item.image ? <Image src={item.image} alt={item.name} width={28} height={28} className="h-7 w-7 rounded-full" /> : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-white">{item.baseAsset}</div>
                  <div className={item.priceChangePercent >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {formatPercent(item.priceChangePercent)}
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{formatCompactCurrency(item.lastPrice)}</span>
                  <span>{item.name}</span>
                </div>
              </div>
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleWatchlist(item.symbol);
                }}
                className="rounded-md border border-white/10 p-2 text-slate-400 hover:text-amber-300"
              >
                <Star className={cn("h-4 w-4", watchlistSymbols.includes(item.symbol) && "fill-current text-amber-300")} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
