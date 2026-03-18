"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { MarketCurrency, MarketHolding, MarketPriceAlert, MarketRange } from "@/types";

type ChartMode = "line" | "candles";

interface MarketStoreState {
  currency: MarketCurrency;
  selectedRange: MarketRange;
  selectedCoinId: string;
  chartMode: ChartMode;
  autoRefresh: boolean;
  watchlist: string[];
  compareCoinIds: string[];
  holdings: MarketHolding[];
  alerts: MarketPriceAlert[];
  setCurrency: (currency: MarketCurrency) => void;
  setSelectedRange: (range: MarketRange) => void;
  setSelectedCoinId: (coinId: string) => void;
  setChartMode: (mode: ChartMode) => void;
  toggleAutoRefresh: () => void;
  setWatchlist: (coinIds: string[]) => void;
  toggleWatchlistCoin: (coinId: string) => void;
  setCompareCoinIds: (coinIds: string[]) => void;
  upsertHolding: (holding: MarketHolding) => void;
  removeHolding: (coinId: string) => void;
  addAlert: (alert: Omit<MarketPriceAlert, "id" | "createdAt" | "triggered">) => void;
  removeAlert: (id: string) => void;
  markAlertTriggered: (id: string) => void;
}

const defaultHoldings: MarketHolding[] = [
  { coinId: "bitcoin", symbol: "BTC", name: "Bitcoin", quantity: 0.12, avgBuyPrice: 61200 },
  { coinId: "ethereum", symbol: "ETH", name: "Ethereum", quantity: 1.3, avgBuyPrice: 3150 },
  { coinId: "solana", symbol: "SOL", name: "Solana", quantity: 15, avgBuyPrice: 132 },
];

export const useMarketStore = create<MarketStoreState>()(
  persist(
    (set) => ({
      currency: "usd",
      selectedRange: "24H",
      selectedCoinId: "bitcoin",
      chartMode: "line",
      autoRefresh: true,
      watchlist: ["bitcoin", "ethereum", "solana"],
      compareCoinIds: ["bitcoin", "ethereum"],
      holdings: defaultHoldings,
      alerts: [],
      setCurrency: (currency) => set({ currency }),
      setSelectedRange: (selectedRange) => set({ selectedRange }),
      setSelectedCoinId: (selectedCoinId) => set({ selectedCoinId }),
      setChartMode: (chartMode) => set({ chartMode }),
      toggleAutoRefresh: () => set((state) => ({ autoRefresh: !state.autoRefresh })),
      setWatchlist: (watchlist) => set({ watchlist }),
      toggleWatchlistCoin: (coinId) =>
        set((state) => ({
          watchlist: state.watchlist.includes(coinId)
            ? state.watchlist.filter((item) => item !== coinId)
            : [...state.watchlist, coinId],
        })),
      setCompareCoinIds: (compareCoinIds) => set({ compareCoinIds: compareCoinIds.slice(0, 3) }),
      upsertHolding: (holding) =>
        set((state) => {
          const existing = state.holdings.find((item) => item.coinId === holding.coinId);
          return {
            holdings: existing
              ? state.holdings.map((item) => (item.coinId === holding.coinId ? holding : item))
              : [...state.holdings, holding],
          };
        }),
      removeHolding: (coinId) =>
        set((state) => ({
          holdings: state.holdings.filter((item) => item.coinId !== coinId),
        })),
      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            {
              ...alert,
              id: `${alert.coinId}-${alert.direction}-${alert.targetPrice}`,
              createdAt: new Date().toISOString(),
              triggered: false,
            },
            ...state.alerts.filter(
              (item) =>
                !(
                  item.coinId === alert.coinId &&
                  item.direction === alert.direction &&
                  item.targetPrice === alert.targetPrice
                ),
            ),
          ],
        })),
      removeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((item) => item.id !== id),
        })),
      markAlertTriggered: (id) =>
        set((state) => ({
          alerts: state.alerts.map((item) =>
            item.id === id ? { ...item, triggered: true } : item,
          ),
        })),
    }),
    {
      name: "solanablocks-markets",
      partialize: (state) => ({
        currency: state.currency,
        selectedRange: state.selectedRange,
        selectedCoinId: state.selectedCoinId,
        chartMode: state.chartMode,
        autoRefresh: state.autoRefresh,
        watchlist: state.watchlist,
        compareCoinIds: state.compareCoinIds,
        holdings: state.holdings,
        alerts: state.alerts,
      }),
    },
  ),
);
