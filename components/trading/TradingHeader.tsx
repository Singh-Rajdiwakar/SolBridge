"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Activity, RefreshCcw } from "lucide-react";

import type { TradingMarketStats, TradingSymbol } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SYMBOL_LABELS, TRADING_SYMBOLS } from "@/components/trading/constants";
import { formatCompactCurrency, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

export function TradingHeader({
  stats,
  selectedSymbol,
  onSelectSymbol,
  onRefresh,
}: {
  stats?: TradingMarketStats;
  selectedSymbol: TradingSymbol;
  onSelectSymbol: (symbol: TradingSymbol) => void;
  onRefresh: () => void;
}) {
  const [flashTone, setFlashTone] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!stats) {
      return;
    }
    setFlashTone(stats.priceChange >= 0 ? "up" : "down");
    const timeout = window.setTimeout(() => setFlashTone(null), 900);
    return () => window.clearTimeout(timeout);
  }, [stats]);

  return (
    <div className="glass-panel space-y-4 border-cyan-400/12 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          {stats?.image ? (
            <Image src={stats.image} alt={stats.name} width={44} height={44} className="h-11 w-11 rounded-full" />
          ) : null}
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Trading Terminal</div>
            <div className="mt-1 flex items-center gap-3">
              <div className="text-2xl font-semibold text-white">
                {stats ? SYMBOL_LABELS[stats.symbol] : SYMBOL_LABELS[selectedSymbol]}
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                <Activity className="h-3.5 w-3.5" />
                Live
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedSymbol} onValueChange={(value) => onSelectSymbol(value as TradingSymbol)}>
            <SelectTrigger className="w-[10rem]">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              {TRADING_SYMBOLS.map((symbol) => (
                <SelectItem key={symbol} value={symbol}>
                  {SYMBOL_LABELS[symbol]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <div
          className={cn(
            "rounded-md border px-3 py-3 transition-colors",
            flashTone === "up"
              ? "border-emerald-400/30 bg-emerald-500/10"
              : flashTone === "down"
                ? "border-rose-400/30 bg-rose-500/10"
                : "border-white/10 bg-white/[0.03]",
          )}
        >
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Live Price</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {stats ? formatCompactCurrency(stats.lastPrice) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h Change</div>
          <div className={cn("mt-1 text-lg font-semibold", (stats?.priceChangePercent || 0) >= 0 ? "text-emerald-300" : "text-rose-300")}>
            {stats ? formatPercent(stats.priceChangePercent) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h High</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {stats ? formatCompactCurrency(stats.highPrice) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h Low</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {stats ? formatCompactCurrency(stats.lowPrice) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Market Cap</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {stats ? formatCompactCurrency(stats.marketCap) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h Volume</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {stats ? formatCompactCurrency(stats.quoteVolume) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Trend</div>
          <div className="mt-1 text-lg font-semibold text-white">{stats?.trend || "--"}</div>
        </div>
      </div>
    </div>
  );
}
