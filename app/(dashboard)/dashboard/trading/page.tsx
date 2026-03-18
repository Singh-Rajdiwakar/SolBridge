"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ActivitySquare, PauseCircle, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  AlertsPanel,
  CandlestickChart,
  CompareChartPanel,
  MarketStatsCard,
  ProfitLossPanel,
  TopMoversStrip,
  TradeSimulationPanel,
  TradingHeader,
  WatchlistSidebar,
} from "@/components/trading";
import { TRADING_SYMBOLS } from "@/components/trading/constants";
import { Button } from "@/components/ui/button";
import { tradingApi } from "@/services/api";
import { useTradingStore } from "@/store/trading-store";
import type { TradingAlert, TradingSymbol, TradingWorkspace } from "@/types";
import { formatRelativeTime } from "@/utils/format";

export default function TradingPage() {
  const selectedSymbol = useTradingStore((state) => state.selectedSymbol);
  const timeframe = useTradingStore((state) => state.timeframe);
  const chartMode = useTradingStore((state) => state.chartMode);
  const compareSymbol = useTradingStore((state) => state.compareSymbol);
  const indicators = useTradingStore((state) => state.indicators);
  const markers = useTradingStore((state) => state.markers);
  const setSelectedSymbol = useTradingStore((state) => state.setSelectedSymbol);
  const setTimeframe = useTradingStore((state) => state.setTimeframe);
  const setChartMode = useTradingStore((state) => state.setChartMode);
  const setCompareSymbol = useTradingStore((state) => state.setCompareSymbol);
  const toggleIndicator = useTradingStore((state) => state.toggleIndicator);
  const resetIndicators = useTradingStore((state) => state.resetIndicators);
  const addMarker = useTradingStore((state) => state.addMarker);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [watchlistSymbols, setWatchlistSymbols] = useState<TradingSymbol[]>(TRADING_SYMBOLS);
  const [alerts, setAlerts] = useState<TradingAlert[]>([]);
  const [simulationResult, setSimulationResult] = useState<Awaited<ReturnType<typeof tradingApi.simulateTrade>>>();

  const tickerQuery = useQuery({
    queryKey: ["trading", "ticker", watchlistSymbols],
    queryFn: () => tradingApi.ticker(Array.from(new Set([...TRADING_SYMBOLS, ...watchlistSymbols])) as TradingSymbol[]),
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 4000,
  });

  const workspaceQuery = useQuery({
    queryKey: ["trading", "workspace"],
    queryFn: () => tradingApi.watchlist(),
  });

  const alertsQuery = useQuery({
    queryKey: ["trading", "alerts"],
    queryFn: () => tradingApi.alerts(),
  });

  const statsQuery = useQuery({
    queryKey: ["trading", "stats", selectedSymbol],
    queryFn: () => tradingApi.marketStats(selectedSymbol),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const candlesQuery = useQuery({
    queryKey: ["trading", "candles", selectedSymbol, timeframe],
    queryFn: () => tradingApi.candles(selectedSymbol, { interval: timeframe, limit: 220 }),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const compareQuery = useQuery({
    queryKey: ["trading", "compare", selectedSymbol, compareSymbol, timeframe],
    queryFn: () => tradingApi.compare(selectedSymbol, compareSymbol, timeframe),
    enabled: Boolean(compareSymbol && compareSymbol !== selectedSymbol),
    refetchInterval: autoRefresh ? 12000 : false,
  });

  useEffect(() => {
    if (workspaceQuery.data?.watchlistSymbols?.length) {
      setWatchlistSymbols(workspaceQuery.data.watchlistSymbols);
    }
  }, [workspaceQuery.data?.watchlistSymbols]);

  useEffect(() => {
    if (alertsQuery.data) {
      setAlerts(alertsQuery.data);
    } else if (workspaceQuery.data?.alerts) {
      setAlerts(workspaceQuery.data.alerts);
    }
  }, [alertsQuery.data, workspaceQuery.data?.alerts]);

  const watchlistMutation = useMutation({
    mutationFn: (symbols: TradingSymbol[]) => tradingApi.saveWatchlist(symbols),
    onSuccess: (workspace: TradingWorkspace) => {
      setWatchlistSymbols(workspace.watchlistSymbols);
    },
  });

  const simulateMutation = useMutation({
    mutationFn: tradingApi.simulateTrade,
    onSuccess: (result) => {
      setSimulationResult(result);
      toast.success("Trade simulation ready");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Trade simulation failed");
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: tradingApi.createAlert,
    onSuccess: (alert) => {
      setAlerts((current) => [alert, ...current]);
      toast.success("Alert created");
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: tradingApi.deleteAlert,
    onSuccess: (nextAlerts) => {
      setAlerts(nextAlerts);
      toast.success("Alert removed");
    },
  });

  const watchlistItems = useMemo(
    () =>
      (tickerQuery.data?.items || []).filter((item) =>
        watchlistSymbols.includes(item.symbol as TradingSymbol),
      ),
    [tickerQuery.data?.items, watchlistSymbols],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trading Terminal"
        subtitle="A pro crypto chart dashboard with live candles, volume, indicators, markers, watchlist management, alerts, and trade simulation for major assets."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Feed Status</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                <ActivitySquare className="h-4 w-4 text-cyan-300" />
                {tickerQuery.data?.lastUpdated ? `Live • ${formatRelativeTime(tickerQuery.data.lastUpdated)}` : "Syncing"}
              </div>
            </div>
            <Button variant="secondary" onClick={() => setAutoRefresh((current) => !current)}>
              {autoRefresh ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              {autoRefresh ? "Pause Feed" : "Resume Feed"}
            </Button>
          </div>
        }
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <TopMoversStrip ticker={tickerQuery.data} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <TradingHeader
          stats={statsQuery.data}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
          onRefresh={() => {
            tickerQuery.refetch();
            statsQuery.refetch();
            candlesQuery.refetch();
          }}
        />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.7fr_0.95fr]">
        <motion.div className="space-y-6" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <WatchlistSidebar
            items={watchlistItems}
            selectedSymbol={selectedSymbol}
            watchlistSymbols={watchlistSymbols}
            onSelect={setSelectedSymbol}
            onToggleWatchlist={(symbol) => {
              const next = watchlistSymbols.includes(symbol)
                ? watchlistSymbols.filter((item) => item !== symbol)
                : [...watchlistSymbols, symbol];
              setWatchlistSymbols(next);
              watchlistMutation.mutate(next, {
                onError: (error: unknown) => {
                  toast.error(error instanceof Error ? error.message : "Failed to update watchlist");
                },
              });
            }}
          />
          <MarketStatsCard stats={statsQuery.data} />
        </motion.div>

        <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
          <CandlestickChart
            data={candlesQuery.data}
            chartMode={chartMode}
            timeframe={timeframe}
            indicators={indicators}
            markers={markers.filter((marker) => !marker.symbol || marker.symbol === selectedSymbol)}
            loading={candlesQuery.isLoading}
            onTimeframeChange={setTimeframe}
            onChartModeChange={setChartMode}
            onToggleIndicator={toggleIndicator}
            onResetIndicators={resetIndicators}
          />
          <CompareChartPanel
            compare={compareQuery.data}
            base={selectedSymbol}
            target={compareSymbol}
            onTargetChange={setCompareSymbol}
          />
        </motion.div>

        <motion.div className="space-y-6" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.34 }}>
          <TradeSimulationPanel
            symbol={selectedSymbol}
            stats={statsQuery.data}
            result={simulationResult}
            loading={simulateMutation.isPending}
            onSimulate={(payload) => simulateMutation.mutate(payload)}
            onAddMarker={() => {
              if (!simulationResult) {
                return;
              }
              addMarker({
                time: simulationResult.marker.time,
                price: simulationResult.marker.price,
                side: simulationResult.marker.side,
                text: `${selectedSymbol.slice(0, 3)} ${simulationResult.marker.text}`,
                symbol: selectedSymbol,
                quantity: simulationResult.quantity,
              });
              toast.success("Marker added to chart");
            }}
          />
          <ProfitLossPanel stats={statsQuery.data} simulation={simulationResult} />
          <AlertsPanel
            alerts={alerts}
            selectedSymbol={selectedSymbol}
            loading={createAlertMutation.isPending}
            onCreate={(payload) =>
              createAlertMutation.mutate(payload, {
                onError: (error: unknown) => {
                  toast.error(error instanceof Error ? error.message : "Failed to create alert");
                },
              })
            }
            onDelete={(id) =>
              deleteAlertMutation.mutate(id, {
                onError: (error: unknown) => {
                  toast.error(error instanceof Error ? error.message : "Failed to delete alert");
                },
              })
            }
          />
        </motion.div>
      </div>
    </div>
  );
}
