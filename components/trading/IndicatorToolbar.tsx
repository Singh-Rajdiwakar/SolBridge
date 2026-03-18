"use client";

import type { TradingChartMode, TradingInterval } from "@/types";
import { Button } from "@/components/ui/button";
import { TRADING_INTERVALS } from "@/components/trading/constants";

type IndicatorMap = {
  sma: boolean;
  ema: boolean;
  bollinger: boolean;
  rsi: boolean;
  macd: boolean;
  volumeMa: boolean;
};

export function IndicatorToolbar({
  timeframe,
  chartMode,
  indicators,
  onTimeframeChange,
  onChartModeChange,
  onToggleIndicator,
  onResetIndicators,
  onResetZoom,
}: {
  timeframe: TradingInterval;
  chartMode: TradingChartMode;
  indicators: IndicatorMap;
  onTimeframeChange: (value: TradingInterval) => void;
  onChartModeChange: (mode: TradingChartMode) => void;
  onToggleIndicator: (key: keyof IndicatorMap) => void;
  onResetIndicators: () => void;
  onResetZoom: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["candles", "line", "area"] as TradingChartMode[]).map((mode) => (
          <Button key={mode} size="sm" variant={chartMode === mode ? "default" : "secondary"} onClick={() => onChartModeChange(mode)}>
            {mode === "candles" ? "Candles" : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
        ))}
        {TRADING_INTERVALS.map((interval) => (
          <Button key={interval} size="sm" variant={timeframe === interval ? "default" : "secondary"} onClick={() => onTimeframeChange(interval)}>
            {interval}
          </Button>
        ))}
        <Button size="sm" variant="secondary" onClick={onResetZoom}>
          Reset Zoom
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {([
          ["sma", "SMA"],
          ["ema", "EMA"],
          ["bollinger", "Bollinger"],
          ["rsi", "RSI"],
          ["macd", "MACD"],
          ["volumeMa", "Volume MA"],
        ] as Array<[keyof IndicatorMap, string]>).map(([key, label]) => (
          <Button key={key} size="sm" variant={indicators[key] ? "default" : "secondary"} onClick={() => onToggleIndicator(key)}>
            {label}
          </Button>
        ))}
        <Button size="sm" variant="secondary" onClick={onResetIndicators}>
          Reset Indicators
        </Button>
      </div>
    </div>
  );
}
