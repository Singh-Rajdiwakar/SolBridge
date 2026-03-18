"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type MouseEventParams,
  type UTCTimestamp,
} from "lightweight-charts";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  TradingCandlesResponse,
  TradingChartMode,
  TradingInterval,
  TradingTradeMarker,
} from "@/types";
import { IndicatorToolbar } from "@/components/trading/IndicatorToolbar";
import { formatCompactCurrency, formatPercent } from "@/utils/format";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

type IndicatorFlags = {
  sma: boolean;
  ema: boolean;
  bollinger: boolean;
  rsi: boolean;
  macd: boolean;
  volumeMa: boolean;
};

function compactTime(value: number) {
  return new Date(value * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CandlestickChart({
  data,
  chartMode,
  timeframe,
  indicators,
  markers,
  loading,
  onTimeframeChange,
  onChartModeChange,
  onToggleIndicator,
  onResetIndicators,
}: {
  data?: TradingCandlesResponse;
  chartMode: TradingChartMode;
  timeframe: TradingInterval;
  indicators: IndicatorFlags;
  markers: TradingTradeMarker[];
  loading?: boolean;
  onTimeframeChange: (value: TradingInterval) => void;
  onChartModeChange: (mode: TradingChartMode) => void;
  onToggleIndicator: (key: keyof IndicatorFlags) => void;
  onResetIndicators: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [hovered, setHovered] = useState<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);

  const lowerPanelData = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.candles.map((candle, index) => ({
      label: compactTime(candle.time),
      time: candle.time,
      rsi: data.indicators.rsi[index]?.value ?? null,
      macd: data.indicators.macd.macdLine[index]?.value ?? null,
      signal: data.indicators.macd.signalLine[index]?.value ?? null,
      histogram: data.indicators.macd.histogram[index]?.value ?? null,
    }));
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || !data?.candles.length) {
      return undefined;
    }

    const chart = createChart(containerRef.current, {
      height: 460,
      layout: {
        background: { type: ColorType.Solid, color: "#0E1628" },
        textColor: "#9EB0D0",
      },
      grid: {
        vertLines: { color: "rgba(120,170,255,0.08)" },
        horzLines: { color: "rgba(120,170,255,0.08)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: "rgba(120,170,255,0.14)",
        timeVisible: timeframe !== "1d" && timeframe !== "1w",
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(120,170,255,0.14)",
      },
      localization: {
        priceFormatter: (value: number) => formatCompactCurrency(value),
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22C55E",
      downColor: "#EF4444",
      borderVisible: false,
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",
      lastValueVisible: true,
      priceLineVisible: true,
    });
    const lineSeries = chart.addSeries(LineSeries, {
      color: "#22D3EE",
      lineWidth: 2,
      visible: false,
      priceLineVisible: true,
    });
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#3B82F6",
      topColor: "rgba(59,130,246,0.22)",
      bottomColor: "rgba(59,130,246,0.02)",
      lineWidth: 2,
      visible: false,
      priceLineVisible: true,
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "",
      color: "rgba(96,165,250,0.5)",
    });
    chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
    });

    const smaSeries = chart.addSeries(LineSeries, {
      color: "#F59E0B",
      lineWidth: 1,
      visible: indicators.sma,
    });
    const emaSeries = chart.addSeries(LineSeries, {
      color: "#A855F7",
      lineWidth: 1,
      visible: indicators.ema,
    });
    const bbUpperSeries = chart.addSeries(LineSeries, {
      color: "rgba(34,211,238,0.75)",
      lineWidth: 1,
      visible: indicators.bollinger,
    });
    const bbMiddleSeries = chart.addSeries(LineSeries, {
      color: "rgba(148,163,184,0.75)",
      lineWidth: 1,
      visible: indicators.bollinger,
    });
    const bbLowerSeries = chart.addSeries(LineSeries, {
      color: "rgba(34,211,238,0.75)",
      lineWidth: 1,
      visible: indicators.bollinger,
    });
    const volumeMaSeries = chart.addSeries(LineSeries, {
      color: "#EAB308",
      lineWidth: 1,
      priceScaleId: "",
      visible: indicators.volumeMa,
    });

    const candleData = data.candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    const closeLineData = data.candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      value: candle.close,
    }));
    const volumeData = data.candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      value: candle.volume,
      color: candle.isBullish ? "rgba(34,197,94,0.48)" : "rgba(239,68,68,0.48)",
    }));

    candleSeries.setData(candleData);
    lineSeries.setData(closeLineData);
    areaSeries.setData(closeLineData);
    volumeSeries.setData(volumeData);
    smaSeries.setData(data.indicators.sma.filter(Boolean).map((point) => ({ time: point!.time as UTCTimestamp, value: point!.value })));
    emaSeries.setData(data.indicators.ema.filter(Boolean).map((point) => ({ time: point!.time as UTCTimestamp, value: point!.value })));
    bbUpperSeries.setData(data.indicators.bollinger.filter(Boolean).map((point) => ({ time: point!.time as UTCTimestamp, value: point!.upper })));
    bbMiddleSeries.setData(data.indicators.bollinger.filter(Boolean).map((point) => ({ time: point!.time as UTCTimestamp, value: point!.middle })));
    bbLowerSeries.setData(data.indicators.bollinger.filter(Boolean).map((point) => ({ time: point!.time as UTCTimestamp, value: point!.lower })));
    volumeMaSeries.setData(data.indicators.volumeMa.filter(Boolean).map((point) => ({ time: point!.time as UTCTimestamp, value: point!.value })));

    candleSeries.applyOptions({ visible: chartMode === "candles" });
    lineSeries.applyOptions({ visible: chartMode === "line" });
    areaSeries.applyOptions({ visible: chartMode === "area" });
    smaSeries.applyOptions({ visible: indicators.sma });
    emaSeries.applyOptions({ visible: indicators.ema });
    bbUpperSeries.applyOptions({ visible: indicators.bollinger });
    bbMiddleSeries.applyOptions({ visible: indicators.bollinger });
    bbLowerSeries.applyOptions({ visible: indicators.bollinger });
    volumeMaSeries.applyOptions({ visible: indicators.volumeMa });

    const markerApi = createSeriesMarkers(candleSeries, markers.map((marker) => ({
      time: marker.time as UTCTimestamp,
      position: marker.side === "buy" ? "belowBar" : "aboveBar",
      color: marker.side === "buy" ? "#22C55E" : "#EF4444",
      shape: marker.side === "buy" ? "arrowUp" : "arrowDown",
      text: marker.text,
    })));

    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!param.time || typeof param.time !== "number") {
        setHovered(null);
        return;
      }
      const candle = param.seriesData.get(candleSeries);
      if (candle) {
        const source = data.candles.find((entry) => entry.time === param.time);
        if (source) {
          setHovered({
            time: source.time,
            open: source.open,
            high: source.high,
            low: source.low,
            close: source.close,
            volume: source.volume,
          });
        }
      }
    });

    chart.timeScale().fitContent();
    markerApi.setMarkers(
      markers.map((marker) => ({
        time: marker.time as UTCTimestamp,
        position: marker.side === "buy" ? "belowBar" : "aboveBar",
        color: marker.side === "buy" ? "#22C55E" : "#EF4444",
        shape: marker.side === "buy" ? "arrowUp" : "arrowDown",
        text: marker.text,
      })),
    );

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [chartMode, data, indicators.bollinger, indicators.ema, indicators.sma, indicators.volumeMa, markers, timeframe]);

  if (loading || !data) {
    return <LoadingSkeleton type="chart" />;
  }

  const latest = hovered || {
    time: data.candles.at(-1)?.time || 0,
    open: data.candles.at(-1)?.open || 0,
    high: data.candles.at(-1)?.high || 0,
    low: data.candles.at(-1)?.low || 0,
    close: data.candles.at(-1)?.close || 0,
    volume: data.candles.at(-1)?.volume || 0,
  };
  const changePercent = latest.open ? ((latest.close - latest.open) / latest.open) * 100 : 0;

  return (
    <div className="glass-panel space-y-5 border-white/8 p-5">
      <IndicatorToolbar
        timeframe={timeframe}
        chartMode={chartMode}
        indicators={indicators}
        onTimeframeChange={onTimeframeChange}
        onChartModeChange={onChartModeChange}
        onToggleIndicator={onToggleIndicator}
        onResetIndicators={onResetIndicators}
        onResetZoom={() => chartRef.current?.timeScale().fitContent()}
      />

      <div className="grid gap-3 md:grid-cols-6">
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Open</div>
          <div className="mt-1 text-sm font-semibold text-white">{formatCompactCurrency(latest.open)}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">High</div>
          <div className="mt-1 text-sm font-semibold text-white">{formatCompactCurrency(latest.high)}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Low</div>
          <div className="mt-1 text-sm font-semibold text-white">{formatCompactCurrency(latest.low)}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Close</div>
          <div className="mt-1 text-sm font-semibold text-white">{formatCompactCurrency(latest.close)}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Volume</div>
          <div className="mt-1 text-sm font-semibold text-white">{latest.volume.toFixed(2)}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Change</div>
          <div className={`mt-1 text-sm font-semibold ${changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {formatPercent(changePercent)}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="h-[460px] w-full rounded-md border border-white/8 bg-[#0B1224]" />

      {indicators.rsi ? (
        <div className="rounded-md border border-white/8 bg-[#0B1224] p-3">
          <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">RSI</div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={lowerPanelData}>
                <CartesianGrid stroke="rgba(120,170,255,0.08)" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis domain={[0, 100]} tick={{ fill: "#6E7FA3", fontSize: 10 }} width={36} />
                <Tooltip />
                <Line type="monotone" dataKey="rsi" stroke="#EAB308" dot={false} strokeWidth={1.6} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {indicators.macd ? (
        <div className="rounded-md border border-white/8 bg-[#0B1224] p-3">
          <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">MACD</div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={lowerPanelData}>
                <CartesianGrid stroke="rgba(120,170,255,0.08)" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis tick={{ fill: "#6E7FA3", fontSize: 10 }} width={44} />
                <Tooltip />
                <Bar dataKey="histogram" fill="rgba(59,130,246,0.4)" />
                <Line type="monotone" dataKey="macd" stroke="#22D3EE" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                <Line type="monotone" dataKey="signal" stroke="#A855F7" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
