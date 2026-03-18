"use client";

import { useEffect, useState } from "react";
import { Flag, Play } from "lucide-react";

import type { TradingMarketStats, TradingSimulationResponse, TradingSymbol } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

export function TradeSimulationPanel({
  symbol,
  stats,
  result,
  loading,
  onSimulate,
  onAddMarker,
}: {
  symbol: TradingSymbol;
  stats?: TradingMarketStats;
  result?: TradingSimulationResponse;
  loading?: boolean;
  onSimulate: (payload: {
    symbol: TradingSymbol;
    side: "buy" | "sell";
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => void;
  onAddMarker: () => void;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("0.25");
  const [entryPrice, setEntryPrice] = useState("0");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  useEffect(() => {
    if (stats?.lastPrice) {
      setEntryPrice(String(stats.lastPrice));
    }
  }, [stats?.lastPrice]);

  return (
    <div className="glass-panel space-y-4 border-white/8 p-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Quick Trade Simulation</div>
        <div className="mt-2 text-lg font-semibold text-white">Order panel style workspace</div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" variant={side === "buy" ? "default" : "secondary"} onClick={() => setSide("buy")}>Buy</Button>
        <Button className="flex-1" variant={side === "sell" ? "danger" : "secondary"} onClick={() => setSide("sell")}>Sell</Button>
      </div>
      <div className="grid gap-3">
        <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Quantity" />
        <Input value={entryPrice} onChange={(event) => setEntryPrice(event.target.value)} placeholder="Entry price" />
        <Input value={stopLoss} onChange={(event) => setStopLoss(event.target.value)} placeholder="Stop loss" />
        <Input value={takeProfit} onChange={(event) => setTakeProfit(event.target.value)} placeholder="Take profit" />
      </div>
      <Button
        className="w-full"
        disabled={loading}
        onClick={() =>
          onSimulate({
            symbol,
            side,
            quantity: Number(quantity),
            entryPrice: Number(entryPrice),
            currentPrice: stats?.lastPrice || Number(entryPrice),
            stopLoss: stopLoss ? Number(stopLoss) : undefined,
            takeProfit: takeProfit ? Number(takeProfit) : undefined,
          })
        }
      >
        <Play className="h-4 w-4" />
        {loading ? "Simulating..." : "Simulate Trade"}
      </Button>
      <Button className="w-full" variant="secondary" onClick={onAddMarker} disabled={!result}>
        <Flag className="h-4 w-4" />
        Add Marker to Chart
      </Button>

      {result ? (
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"><span className="text-slate-400">Total Cost</span><span className="font-medium text-white">{formatCompactCurrency(result.totalCost)}</span></div>
          <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"><span className="text-slate-400">Fee Estimate</span><span className="font-medium text-white">{formatCompactCurrency(result.feeEstimate)}</span></div>
          <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"><span className="text-slate-400">Unrealized P&amp;L</span><span className={result.unrealizedPnl >= 0 ? "font-medium text-emerald-300" : "font-medium text-rose-300"}>{formatCompactCurrency(result.unrealizedPnl)}</span></div>
          <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"><span className="text-slate-400">ROI</span><span className={result.roiPercent >= 0 ? "font-medium text-emerald-300" : "font-medium text-rose-300"}>{formatPercent(result.roiPercent)}</span></div>
          <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"><span className="text-slate-400">Risk/Reward</span><span className="font-medium text-white">{result.riskRewardRatio.toFixed(2)}</span></div>
        </div>
      ) : null}
    </div>
  );
}
