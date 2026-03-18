"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Bell, Star, Trash2 } from "lucide-react";

import type { MarketCoin, MarketPriceAlert } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatMarketCurrency, formatMarketPercent } from "@/components/markets/utils";
import { cn } from "@/utils/cn";

export function WatchlistPanel({
  coins,
  alerts,
  currency,
  onOpenCoin,
  onToggleWatchlist,
  onAddAlert,
  onRemoveAlert,
}: {
  coins: MarketCoin[];
  alerts: MarketPriceAlert[];
  currency: string;
  onOpenCoin: (coinId: string) => void;
  onToggleWatchlist: (coinId: string) => void;
  onAddAlert: (payload: { coinId: string; symbol: string; direction: "above" | "below"; targetPrice: number }) => void;
  onRemoveAlert: (id: string) => void;
}) {
  const [selectedCoinId, setSelectedCoinId] = useState(coins[0]?.id || "bitcoin");
  const [targetPrice, setTargetPrice] = useState("0");
  const [direction, setDirection] = useState<"above" | "below">("above");

  const selectedCoin = useMemo(
    () => coins.find((coin) => coin.id === selectedCoinId) || coins[0],
    [coins, selectedCoinId],
  );

  return (
    <div className="glass-panel space-y-5 border-white/8 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Watchlist</div>
          <div className="mt-2 text-xl font-semibold text-white">Track selected coins and price alerts</div>
        </div>
        <div className="rounded-md border border-cyan-400/14 bg-cyan-500/10 p-2 text-cyan-300">
          <Bell className="h-4 w-4" />
        </div>
      </div>

      {coins.length === 0 ? (
        <EmptyState title="Watchlist empty" description="Add coins from the market table or featured cards." />
      ) : (
        <div className="grid gap-3">
          {coins.map((coin) => (
            <div key={coin.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
              <button type="button" className="flex items-center gap-3 text-left" onClick={() => onOpenCoin(coin.id)}>
                <Image src={coin.image} alt={coin.name} width={32} height={32} className="h-8 w-8 rounded-full" />
                <div>
                  <div className="font-medium text-white">{coin.name}</div>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{coin.symbol}</div>
                </div>
              </button>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{formatMarketCurrency(coin.price, currency)}</div>
                <div className={cn("text-xs", coin.priceChange24h >= 0 ? "text-emerald-300" : "text-rose-300")}>
                  {formatMarketPercent(coin.priceChange24h)}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onToggleWatchlist(coin.id)}>
                <Star className="h-4 w-4 fill-current text-amber-300" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <select
          value={selectedCoinId}
          onChange={(event) => setSelectedCoinId(event.target.value)}
          className="h-10 rounded-md border border-white/10 bg-[rgba(17,27,49,0.88)] px-3 text-sm text-slate-100 outline-none"
        >
          {coins.map((coin) => (
            <option key={coin.id} value={coin.id}>
              {coin.name} ({coin.symbol})
            </option>
          ))}
        </select>
        <select
          value={direction}
          onChange={(event) => setDirection(event.target.value as "above" | "below")}
          className="h-10 rounded-md border border-white/10 bg-[rgba(17,27,49,0.88)] px-3 text-sm text-slate-100 outline-none"
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
        <Input value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} placeholder="Alert price" />
      </div>
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          if (!selectedCoin) {
            return;
          }
          onAddAlert({
            coinId: selectedCoin.id,
            symbol: selectedCoin.symbol,
            direction,
            targetPrice: Number(targetPrice),
          });
        }}
      >
        <Bell className="h-4 w-4" />
        Create Price Alert
      </Button>

      {alerts.length > 0 ? (
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Active Alerts</div>
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm">
              <div>
                <div className="font-medium text-white">
                  {alert.symbol} {alert.direction === "above" ? "above" : "below"} {formatMarketCurrency(alert.targetPrice, currency)}
                </div>
                <div className="text-xs text-slate-500">
                  {alert.triggered ? "Triggered" : "Monitoring"} • {new Date(alert.createdAt).toLocaleDateString()}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRemoveAlert(alert.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
