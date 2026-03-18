"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { MarketCoin, MarketHolding } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoinSelector } from "@/components/markets/CoinSelector";
import { formatMarketCurrency, formatMarketPercent } from "@/components/markets/utils";
import { cn } from "@/utils/cn";

export function PortfolioPnLCard({
  holdings,
  coins,
  currency,
  onSaveHolding,
  onRemoveHolding,
}: {
  holdings: MarketHolding[];
  coins: MarketCoin[];
  currency: string;
  onSaveHolding: (holding: MarketHolding) => void;
  onRemoveHolding: (coinId: string) => void;
}) {
  const [draftCoinId, setDraftCoinId] = useState(coins[0]?.id || "bitcoin");
  const [draftQuantity, setDraftQuantity] = useState("0.25");
  const [draftBuyPrice, setDraftBuyPrice] = useState("0");

  const holdingRows = useMemo(
    () =>
      holdings.map((holding) => {
        const marketCoin = coins.find((coin) => coin.id === holding.coinId);
        const currentPrice = marketCoin?.price || 0;
        const invested = holding.avgBuyPrice * holding.quantity;
        const currentValue = currentPrice * holding.quantity;
        const pnl = currentValue - invested;
        return {
          ...holding,
          currentPrice,
          invested,
          currentValue,
          pnl,
          pnlPercent: invested ? (pnl / invested) * 100 : 0,
        };
      }),
    [coins, holdings],
  );

  const totals = useMemo(() => {
    const invested = holdingRows.reduce((sum, row) => sum + row.invested, 0);
    const currentValue = holdingRows.reduce((sum, row) => sum + row.currentValue, 0);
    const pnl = currentValue - invested;
    return {
      invested,
      currentValue,
      pnl,
      pnlPercent: invested ? (pnl / invested) * 100 : 0,
    };
  }, [holdingRows]);

  const selectedCoin = coins.find((coin) => coin.id === draftCoinId);

  return (
    <div className="glass-panel space-y-5 border-white/8 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Portfolio Profit & Loss</div>
          <div className="mt-2 text-xl font-semibold text-white">Track live position performance</div>
        </div>
        <div className="grid gap-2 text-right">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Total Current Value</div>
          <div className="text-2xl font-semibold text-white">{formatMarketCurrency(totals.currentValue, currency)}</div>
          <div className={cn("text-sm font-medium", totals.pnl >= 0 ? "text-emerald-300" : "text-rose-300")}>
            {totals.pnl >= 0 ? "+" : ""}
            {formatMarketCurrency(totals.pnl, currency)} ({formatMarketPercent(totals.pnlPercent)})
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.2fr_0.9fr_0.9fr_auto]">
        <CoinSelector coins={coins} value={draftCoinId} onChange={setDraftCoinId} />
        <Input value={draftQuantity} onChange={(event) => setDraftQuantity(event.target.value)} placeholder="Quantity" />
        <Input value={draftBuyPrice} onChange={(event) => setDraftBuyPrice(event.target.value)} placeholder="Avg buy price" />
        <Button
          onClick={() => {
            if (!selectedCoin) {
              return;
            }
            onSaveHolding({
              coinId: selectedCoin.id,
              symbol: selectedCoin.symbol,
              name: selectedCoin.name,
              quantity: Number(draftQuantity),
              avgBuyPrice: Number(draftBuyPrice || selectedCoin.price),
            });
          }}
        >
          <Plus className="h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Avg Buy</th>
                <th className="px-4 py-3">Market</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Invested</th>
                <th className="px-4 py-3">Current</th>
                <th className="px-4 py-3">P&amp;L</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {holdingRows.map((row) => (
                <tr key={row.coinId} className="bg-white/[0.01]">
                  <td className="px-4 py-3 font-medium text-white">{row.symbol}</td>
                  <td className="px-4 py-3 text-slate-300">{formatMarketCurrency(row.avgBuyPrice, currency)}</td>
                  <td className="px-4 py-3 text-slate-300">{formatMarketCurrency(row.currentPrice, currency)}</td>
                  <td className="px-4 py-3 text-slate-300">{row.quantity}</td>
                  <td className="px-4 py-3 text-slate-300">{formatMarketCurrency(row.invested, currency)}</td>
                  <td className="px-4 py-3 text-slate-300">{formatMarketCurrency(row.currentValue, currency)}</td>
                  <td className={cn("px-4 py-3 font-medium", row.pnl >= 0 ? "text-emerald-300" : "text-rose-300")}>
                    {formatMarketCurrency(row.pnl, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => onRemoveHolding(row.coinId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
