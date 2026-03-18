"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Activity, BarChart3, Expand, RefreshCcw, Star, WandSparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  MarketChartResponse,
  MarketCoin,
  MarketCoinDetail,
  MarketRange,
} from "@/types";
import { CoinSelector } from "@/components/markets/CoinSelector";
import { TimeRangeSelector } from "@/components/markets/TimeRangeSelector";
import {
  badgeTone,
  changeTone,
  formatMarketCompactCurrency,
  formatMarketCurrency,
  formatMarketPercent,
  formatMarketNumber,
} from "@/components/markets/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";
import { formatDate, formatRelativeTime } from "@/utils/format";

function PriceChartCanvas({
  chart,
  chartMode,
  currency,
}: {
  chart: MarketChartResponse;
  chartMode: "line" | "candles";
  currency: string;
}) {
  const data = chart.points.map((point) => ({
    ...point,
    label: new Date(point.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: chart.range === "1H" || chart.range === "24H" ? "numeric" : undefined,
    }),
  }));

  const latest = data.at(-1)?.price ?? 0;
  const earliest = data[0]?.price ?? 0;
  const positive = latest >= earliest;
  const stroke = positive ? "#22D3EE" : "#EF4444";

  const content = chartMode === "line" ? (
    <AreaChart data={data}>
      <defs>
        <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.42} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
      <XAxis dataKey="label" tick={{ fill: "#6E7FA3", fontSize: 11 }} minTickGap={32} />
      <YAxis
        tick={{ fill: "#6E7FA3", fontSize: 11 }}
        tickFormatter={(value) => formatMarketCompactCurrency(Number(value), currency)}
        width={82}
      />
      <Tooltip
        contentStyle={{
          background: "rgba(10,16,32,0.95)",
          border: "1px solid rgba(120,170,255,0.14)",
          borderRadius: 10,
        }}
        formatter={(value: number) => formatMarketCurrency(Number(value), currency)}
        labelFormatter={(_, payload) =>
          payload?.[0]?.payload?.timestamp ? formatDate(payload[0].payload.timestamp) : ""
        }
      />
      <Area
        type="monotone"
        dataKey="price"
        stroke={stroke}
        fill="url(#priceFill)"
        strokeWidth={2.4}
        dot={false}
        isAnimationActive={false}
      />
    </AreaChart>
  ) : (
    <ComposedChart data={data}>
      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
      <XAxis dataKey="label" tick={{ fill: "#6E7FA3", fontSize: 11 }} minTickGap={32} />
      <YAxis
        tick={{ fill: "#6E7FA3", fontSize: 11 }}
        tickFormatter={(value) => formatMarketCompactCurrency(Number(value), currency)}
        width={82}
      />
      <Tooltip
        contentStyle={{
          background: "rgba(10,16,32,0.95)",
          border: "1px solid rgba(120,170,255,0.14)",
          borderRadius: 10,
        }}
        formatter={(value: number, name: string) => [
          formatMarketCurrency(Number(value), currency),
          name === "close" ? "Close" : name === "high" ? "High" : "Low",
        ]}
        labelFormatter={(_, payload) =>
          payload?.[0]?.payload?.timestamp ? formatDate(payload[0].payload.timestamp) : ""
        }
      />
      <Line type="monotone" dataKey="high" stroke="#22D3EE" strokeOpacity={0.6} dot={false} strokeWidth={1.4} isAnimationActive={false} />
      <Line type="monotone" dataKey="low" stroke="#64748B" strokeOpacity={0.7} dot={false} strokeWidth={1.2} isAnimationActive={false} />
      <Line type="monotone" dataKey="close" stroke={stroke} dot={false} strokeWidth={2.2} isAnimationActive={false} />
    </ComposedChart>
  );

  return <ResponsiveContainer width="100%" height="100%">{content}</ResponsiveContainer>;
}

function MarketChartFallback({
  loading,
  hasSelection,
}: {
  loading?: boolean;
  hasSelection: boolean;
}) {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(7,13,26,0.98),rgba(10,17,34,0.94))] p-5">
      <div className="wallet-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-12 top-12 h-24 w-24 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute right-10 top-10 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {loading ? <Activity className="h-4 w-4 text-cyan-300" /> : <BarChart3 className="h-4 w-4 text-cyan-300" />}
          {loading ? "Syncing Market Feed" : "Chart Standby"}
        </div>
        <div className="text-xl font-semibold text-white">
          {loading ? "Loading real-time candles" : hasSelection ? "Waiting for market candles" : "Select a coin to render data"}
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-400">
          {loading
            ? "Pulling price points, volume, and range data from the live market service."
            : "The chart will populate as soon as historical candles are available for the selected asset and range."}
        </p>
      </div>

      <div className="relative mt-6 space-y-4">
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 18 }).map((_, index) => (
            <div
              key={`chart-grid-${index}`}
              className="h-8 rounded-md border border-white/[0.05] bg-white/[0.02]"
            />
          ))}
        </div>
        <div className="flex h-40 items-end gap-2">
          {Array.from({ length: 18 }).map((_, index) => (
            <div
              key={`chart-bar-${index}`}
              className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-400/8 to-cyan-300/20"
              style={{ height: `${32 + ((index * 19) % 68)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MainPriceChart({
  coins,
  selectedCoin,
  detail,
  chart,
  currency,
  range,
  chartMode,
  autoRefresh,
  loading,
  inWatchlist,
  onCoinChange,
  onRangeChange,
  onChartModeChange,
  onRefresh,
  onToggleWatchlist,
  onCompare,
}: {
  coins: MarketCoin[];
  selectedCoin?: MarketCoin | null;
  detail?: MarketCoinDetail | null;
  chart?: MarketChartResponse;
  currency: string;
  range: MarketRange;
  chartMode: "line" | "candles";
  autoRefresh: boolean;
  loading?: boolean;
  inWatchlist?: boolean;
  onCoinChange: (coinId: string) => void;
  onRangeChange: (range: MarketRange) => void;
  onChartModeChange: (mode: "line" | "candles") => void;
  onRefresh: () => void;
  onToggleWatchlist: () => void;
  onCompare: () => void;
}) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const headerCoin = detail || selectedCoin;
  const chartDelta = useMemo(() => {
    if (!chart?.points?.length) {
      return 0;
    }
    const first = chart.points[0]?.price || 0;
    const last = chart.points.at(-1)?.price || 0;
    return first ? ((last - first) / first) * 100 : 0;
  }, [chart]);

  return (
    <>
      <div className="glass-panel space-y-5 border-cyan-400/12 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {headerCoin?.image ? (
                <Image src={headerCoin.image} alt={headerCoin.name} width={44} height={44} className="h-11 w-11 rounded-full ring-1 ring-white/10" />
              ) : null}
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Real-Time Price Chart</div>
                <div className="text-2xl font-semibold text-white">
                  {headerCoin?.name || "Select a coin"}
                  {headerCoin?.symbol ? (
                    <span className="ml-2 text-sm uppercase tracking-[0.18em] text-slate-500">
                      {headerCoin.symbol}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-3xl font-semibold tracking-tight text-white">
                {headerCoin ? formatMarketCurrency(headerCoin.price, currency) : "--"}
              </div>
              <div className={cn("rounded-md border px-3 py-1.5 text-sm font-semibold", badgeTone(chartDelta))}>
                {chartDelta >= 0 ? "+" : ""}
                {formatMarketPercent(chartDelta)}
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                {chart?.lastUpdated ? `Last updated ${formatRelativeTime(chart.lastUpdated)}` : "Waiting for market data"}
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-cyan-300">
                {autoRefresh ? "Live refresh on" : "Auto refresh paused"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
            <CoinSelector coins={coins} value={selectedCoin?.id || "bitcoin"} onChange={onCoinChange} />
            <div className="flex gap-2">
              <Button
                type="button"
                variant={chartMode === "line" ? "default" : "secondary"}
                className="flex-1"
                onClick={() => onChartModeChange("line")}
              >
                Line
              </Button>
              <Button
                type="button"
                variant={chartMode === "candles" ? "default" : "secondary"}
                className="flex-1"
                onClick={() => onChartModeChange("candles")}
              >
                Candles
              </Button>
            </div>
            <div className="sm:col-span-2">
              <TimeRangeSelector value={range} onChange={onRangeChange} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h High</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">
              {headerCoin ? formatMarketCurrency(headerCoin.high24h, currency) : "--"}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h Low</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">
              {headerCoin ? formatMarketCurrency(headerCoin.low24h, currency) : "--"}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Market Cap</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">
              {headerCoin ? formatMarketCompactCurrency(headerCoin.marketCap, currency) : "--"}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Volume</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">
              {headerCoin ? formatMarketCompactCurrency(headerCoin.totalVolume, currency) : "--"}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Supply</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">
              {headerCoin ? formatMarketNumber(headerCoin.circulatingSupply, 0) : "--"}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h Delta</div>
            <div className={cn("mt-1 text-sm font-semibold", changeTone(headerCoin?.priceChange24h || 0))}>
              {headerCoin ? formatMarketPercent(headerCoin.priceChange24h) : "--"}
            </div>
          </div>
        </div>

        <div className="h-[24rem]">
          {loading ? (
            <MarketChartFallback loading hasSelection={Boolean(headerCoin)} />
          ) : chart?.points?.length ? (
            <PriceChartCanvas chart={chart} chartMode={chartMode} currency={currency} />
          ) : (
            <MarketChartFallback hasSelection={Boolean(headerCoin)} />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={() => setFullscreenOpen(true)}>
            <Expand className="h-4 w-4" />
            Fullscreen
          </Button>
          <Button variant="secondary" onClick={onToggleWatchlist}>
            <Star className="h-4 w-4" />
            {inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          </Button>
          <Button variant="secondary" onClick={onCompare}>
            <WandSparkles className="h-4 w-4" />
            Compare
          </Button>
        </div>
      </div>

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="w-[min(96vw,78rem)]">
          <DialogHeader>
            <DialogTitle>{headerCoin?.name || "Market chart"}</DialogTitle>
            <DialogDescription>
              Expanded market view with {chartMode === "line" ? "price timeline" : "range and close"} data.
            </DialogDescription>
          </DialogHeader>
          <div className="h-[34rem]">
            {chart ? <PriceChartCanvas chart={chart} chartMode={chartMode} currency={currency} /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
