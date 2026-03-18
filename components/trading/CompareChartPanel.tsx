"use client";

import { ActivitySquare, GitCompareArrows } from "lucide-react";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

import type { TradingCompareResponse, TradingSymbol } from "@/types";
import { Button } from "@/components/ui/button";
import { SYMBOL_LABELS, TRADING_SYMBOLS } from "@/components/trading/constants";
import { formatPercent } from "@/utils/format";

export function CompareChartPanel({
  compare,
  base,
  target,
  onTargetChange,
}: {
  compare?: TradingCompareResponse;
  base: TradingSymbol;
  target: TradingSymbol;
  onTargetChange: (symbol: TradingSymbol) => void;
}) {
  const data = compare?.base.series.map((point, index) => ({
    label: new Date(point.time * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    base: point.value,
    target: compare.target.series[index]?.value ?? null,
  })) || [];
  const hasSeries = data.length > 1;

  return (
    <div className="glass-panel space-y-4 border-white/8 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Compare Mode</div>
          <div className="mt-2 text-lg font-semibold text-white">Relative performance</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRADING_SYMBOLS.filter((symbol) => symbol !== base).map((symbol) => (
            <Button key={symbol} size="sm" variant={target === symbol ? "default" : "secondary"} onClick={() => onTargetChange(symbol)}>
              {SYMBOL_LABELS[symbol]}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-64">
        {hasSeries ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(120,170,255,0.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#6E7FA3", fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fill: "#6E7FA3", fontSize: 11 }} tickFormatter={(value) => formatPercent(Number(value))} width={60} />
              <Tooltip formatter={(value: number) => formatPercent(Number(value))} />
              <Line type="monotone" dataKey="base" stroke="#22D3EE" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line type="monotone" dataKey="target" stroke="#A855F7" dot={false} strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,28,0.96),rgba(10,17,34,0.92))] p-5">
            <div className="wallet-grid pointer-events-none absolute inset-0 opacity-25" />
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-10 top-8 h-20 w-20 rounded-full bg-cyan-400/8 blur-3xl" />
              <div className="absolute right-10 bottom-8 h-24 w-24 rounded-full bg-blue-500/8 blur-3xl" />
            </div>
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                <GitCompareArrows className="h-4 w-4 text-cyan-300" />
                Compare feed standby
              </div>
              <div className="text-lg font-semibold text-white">Normalized performance will render here</div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                Select a comparison asset and wait for synced candles to load. Relative performance, volatility spread, and momentum divergence will appear in this panel.
              </p>
            </div>
            <div className="relative mt-4 space-y-4">
              <div className="flex h-32 items-end gap-2">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={`compare-bar-${index}`}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500/8 to-cyan-400/20"
                    style={{ height: `${28 + ((index * 13) % 62)}%` }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ActivitySquare className="h-4 w-4 text-cyan-300" />
                Waiting for synchronized candles for {SYMBOL_LABELS[base]} vs {SYMBOL_LABELS[target]}.
              </div>
            </div>
          </div>
        )}
      </div>

      {compare ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm">
            <div className="text-slate-400">{compare.base.symbol} volatility</div>
            <div className="mt-1 font-medium text-white">{formatPercent(compare.base.volatility)}</div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm">
            <div className="text-slate-400">{compare.target.symbol} volatility</div>
            <div className="mt-1 font-medium text-white">{formatPercent(compare.target.volatility)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
