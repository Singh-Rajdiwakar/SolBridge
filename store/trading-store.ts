"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  TradingAlert,
  TradingChartMode,
  TradingInterval,
  TradingSymbol,
  TradingTradeMarker,
} from "@/types";

interface TradingIndicatorSettings {
  sma: boolean;
  ema: boolean;
  bollinger: boolean;
  rsi: boolean;
  macd: boolean;
  volumeMa: boolean;
}

interface TradingStoreState {
  selectedSymbol: TradingSymbol;
  timeframe: TradingInterval;
  chartMode: TradingChartMode;
  compareSymbol: TradingSymbol;
  indicators: TradingIndicatorSettings;
  markers: TradingTradeMarker[];
  toggleIndicator: (key: keyof TradingIndicatorSettings) => void;
  resetIndicators: () => void;
  setSelectedSymbol: (symbol: TradingSymbol) => void;
  setTimeframe: (timeframe: TradingInterval) => void;
  setChartMode: (mode: TradingChartMode) => void;
  setCompareSymbol: (symbol: TradingSymbol) => void;
  addMarker: (marker: Omit<TradingTradeMarker, "id">) => void;
  clearMarkers: () => void;
}

const defaultIndicators: TradingIndicatorSettings = {
  sma: true,
  ema: true,
  bollinger: false,
  rsi: true,
  macd: true,
  volumeMa: true,
};

export const useTradingStore = create<TradingStoreState>()(
  persist(
    (set) => ({
      selectedSymbol: "BTCUSDT",
      timeframe: "1h",
      chartMode: "candles",
      compareSymbol: "ETHUSDT",
      indicators: defaultIndicators,
      markers: [],
      toggleIndicator: (key) =>
        set((state) => ({
          indicators: {
            ...state.indicators,
            [key]: !state.indicators[key],
          },
        })),
      resetIndicators: () => set({ indicators: defaultIndicators }),
      setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setChartMode: (chartMode) => set({ chartMode }),
      setCompareSymbol: (compareSymbol) => set({ compareSymbol }),
      addMarker: (marker) =>
        set((state) => ({
          markers: [
            ...state.markers,
            {
              ...marker,
              id: `${marker.side}-${marker.time}-${marker.price}`,
            },
          ].slice(-20),
        })),
      clearMarkers: () => set({ markers: [] }),
    }),
    {
      name: "solanablocks-trading",
      partialize: (state) => ({
        selectedSymbol: state.selectedSymbol,
        timeframe: state.timeframe,
        chartMode: state.chartMode,
        compareSymbol: state.compareSymbol,
        indicators: state.indicators,
      }),
    },
  ),
);
