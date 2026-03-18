"use client";

import { useEffect, useState } from "react";
import { Calculator } from "lucide-react";

import type { MarketCoin, MarketProfitLossResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoinSelector } from "@/components/markets/CoinSelector";
import {
  badgeTone,
  formatMarketCurrency,
  formatMarketPercent,
} from "@/components/markets/utils";
import { cn } from "@/utils/cn";

export function ProfitLossCalculator({
  coins,
  currency,
  selectedCoinId,
  result,
  loading,
  onSelectCoin,
  onCalculate,
}: {
  coins: MarketCoin[];
  currency: string;
  selectedCoinId: string;
  result?: MarketProfitLossResponse | null;
  loading?: boolean;
  onSelectCoin: (coinId: string) => void;
  onCalculate: (payload: { buyPrice: number; currentPrice: number; quantity: number }) => void;
}) {
  const selectedCoin = coins.find((coin) => coin.id === selectedCoinId) || coins[0];
  const [buyPrice, setBuyPrice] = useState("0");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (selectedCoin) {
      setBuyPrice(String(Math.max(selectedCoin.price * 0.88, 0.01).toFixed(2)));
    }
  }, [selectedCoin]);

  return (
    <div className="glass-panel space-y-5 border-white/8 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Profit / Loss Calculator</div>
          <div className="mt-2 text-xl font-semibold text-white">Estimate crypto position performance</div>
        </div>
        <div className="rounded-md border border-cyan-400/14 bg-cyan-500/10 p-2 text-cyan-300">
          <Calculator className="h-4 w-4" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <CoinSelector coins={coins} value={selectedCoinId} onChange={onSelectCoin} />
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Current Price</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {selectedCoin ? formatMarketCurrency(selectedCoin.price, currency) : "--"}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Buy Price</label>
          <Input value={buyPrice} onChange={(event) => setBuyPrice(event.target.value)} placeholder="42000" />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Quantity</label>
          <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0.25" />
        </div>
      </div>

      <Button
        className="w-full"
        disabled={loading}
        onClick={() =>
          onCalculate({
            buyPrice: Number(buyPrice),
            currentPrice: selectedCoin?.price || 0,
            quantity: Number(quantity),
          })
        }
      >
        {loading ? "Calculating..." : "Calculate P&L"}
      </Button>

      {result ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Total Investment</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {formatMarketCurrency(result.investedValue, currency)}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Current Value</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {formatMarketCurrency(result.currentValue, currency)}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Profit / Loss</div>
            <div className={cn("mt-1 text-sm font-semibold", result.profitLoss >= 0 ? "text-emerald-300" : "text-rose-300")}>
              {formatMarketCurrency(result.profitLoss, currency)}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">ROI</div>
            <div className={cn("mt-1 inline-flex rounded-md border px-2 py-1 text-sm font-semibold", badgeTone(result.profitLossPercent))}>
              {result.profitLossPercent >= 0 ? "+" : ""}
              {formatMarketPercent(result.profitLossPercent)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
