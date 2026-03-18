"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, PauseCircle, PlayCircle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  CoinDetailDrawer,
  CompareCoinsPanel,
  FeaturedCoinCard,
  LivePriceTicker,
  MainPriceChart,
  MarketOverviewCards,
  MarketTable,
  PortfolioAllocationChart,
  PortfolioPnLCard,
  ProfitLossCalculator,
  TopGainersCard,
  TopLosersCard,
  WatchlistPanel,
} from "@/components/markets";
import { MARKET_CURRENCY_OPTIONS, formatMarketCompactCurrency } from "@/components/markets/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { marketsApi } from "@/services/api";
import { useMarketStore } from "@/store/market-store";
import type { MarketCoin, MarketCurrency, MarketHolding, MarketWatchlist } from "@/types";
import { formatRelativeTime } from "@/utils/format";

function uniqueCoins(...groups: Array<Array<MarketCoin | undefined>>) {
  const map = new Map<string, MarketCoin>();
  groups.flat().forEach((coin) => {
    if (coin) {
      map.set(coin.id, coin);
    }
  });
  return Array.from(map.values());
}

export default function MarketsPage() {
  const syncWatchlistRef = useRef(false);
  const [tablePage, setTablePage] = useState(1);
  const [drawerCoinId, setDrawerCoinId] = useState<string | null>(null);

  const currency = useMarketStore((state) => state.currency);
  const selectedRange = useMarketStore((state) => state.selectedRange);
  const selectedCoinId = useMarketStore((state) => state.selectedCoinId);
  const chartMode = useMarketStore((state) => state.chartMode);
  const autoRefresh = useMarketStore((state) => state.autoRefresh);
  const watchlist = useMarketStore((state) => state.watchlist);
  const compareCoinIds = useMarketStore((state) => state.compareCoinIds);
  const holdings = useMarketStore((state) => state.holdings);
  const alerts = useMarketStore((state) => state.alerts);
  const setCurrency = useMarketStore((state) => state.setCurrency);
  const setSelectedRange = useMarketStore((state) => state.setSelectedRange);
  const setSelectedCoinId = useMarketStore((state) => state.setSelectedCoinId);
  const setChartMode = useMarketStore((state) => state.setChartMode);
  const toggleAutoRefresh = useMarketStore((state) => state.toggleAutoRefresh);
  const setWatchlist = useMarketStore((state) => state.setWatchlist);
  const setCompareCoinIds = useMarketStore((state) => state.setCompareCoinIds);
  const upsertHolding = useMarketStore((state) => state.upsertHolding);
  const removeHolding = useMarketStore((state) => state.removeHolding);
  const addAlert = useMarketStore((state) => state.addAlert);
  const removeAlert = useMarketStore((state) => state.removeAlert);
  const markAlertTriggered = useMarketStore((state) => state.markAlertTriggered);

  const overviewQuery = useQuery({
    queryKey: ["markets", "overview", currency],
    queryFn: () => marketsApi.overview(currency),
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 4000,
  });

  const coinsQuery = useQuery({
    queryKey: ["markets", "coins", currency, tablePage],
    queryFn: () => marketsApi.coins({ currency, page: tablePage, perPage: 25 }),
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 4000,
  });

  const selectedCoinDetailQuery = useQuery({
    queryKey: ["markets", "coin", selectedCoinId, currency],
    queryFn: () => marketsApi.coin(selectedCoinId, currency),
    enabled: Boolean(selectedCoinId),
    refetchInterval: autoRefresh ? 15000 : false,
  });

  const chartQuery = useQuery({
    queryKey: ["markets", "chart", selectedCoinId, selectedRange, currency],
    queryFn: () => marketsApi.chart(selectedCoinId, selectedRange, currency),
    enabled: Boolean(selectedCoinId),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const gainersQuery = useQuery({
    queryKey: ["markets", "gainers", currency],
    queryFn: () => marketsApi.gainers(currency),
    refetchInterval: autoRefresh ? 15000 : false,
  });

  const losersQuery = useQuery({
    queryKey: ["markets", "losers", currency],
    queryFn: () => marketsApi.losers(currency),
    refetchInterval: autoRefresh ? 15000 : false,
  });

  const watchlistQuery = useQuery({
    queryKey: ["markets", "watchlist"],
    queryFn: () => marketsApi.watchlist(),
  });

  const watchlistCoinsQuery = useQuery({
    queryKey: ["markets", "watchlist-coins", currency, watchlist.join(",")],
    queryFn: () =>
      marketsApi.coins({
        currency,
        ids: watchlist.join(","),
        perPage: Math.max(watchlist.length, 1),
      }),
    enabled: watchlist.length > 0,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const drawerCoinDetailQuery = useQuery({
    queryKey: ["markets", "drawer-coin", drawerCoinId, currency],
    queryFn: () => marketsApi.coin(drawerCoinId!, currency),
    enabled: Boolean(drawerCoinId),
  });

  const drawerChartQuery = useQuery({
    queryKey: ["markets", "drawer-chart", drawerCoinId, currency],
    queryFn: () => marketsApi.chart(drawerCoinId!, "7D", currency),
    enabled: Boolean(drawerCoinId),
  });

  const compareIds = useMemo(
    () => Array.from(new Set(compareCoinIds.filter(Boolean))).slice(0, 3),
    [compareCoinIds],
  );

  const compareChartsQuery = useQuery({
    queryKey: ["markets", "compare", compareIds.join(","), selectedRange, currency],
    queryFn: async () => {
      const payload = await Promise.all(compareIds.map((coinId) => marketsApi.chart(coinId, selectedRange, currency)));
      return compareIds.reduce<Record<string, Awaited<typeof payload>[number]>>((accumulator, coinId, index) => {
        accumulator[coinId] = payload[index];
        return accumulator;
      }, {});
    },
    enabled: compareIds.length > 0,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const profitLossMutation = useMutation({
    mutationFn: (payload: { buyPrice: number; currentPrice: number; quantity: number }) => marketsApi.profitLoss(payload),
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to calculate profit and loss");
    },
  });

  const watchlistMutation = useMutation({
    mutationFn: (payload: MarketWatchlist) => marketsApi.saveWatchlist({ coinIds: payload.coinIds, currency: payload.currency as MarketCurrency }),
  });

  useEffect(() => {
    if (syncWatchlistRef.current || !watchlistQuery.data) {
      return;
    }
    syncWatchlistRef.current = true;
    setWatchlist(watchlistQuery.data.coinIds);
    if (watchlistQuery.data.currency) {
      setCurrency(watchlistQuery.data.currency as MarketCurrency);
    }
  }, [setCurrency, setWatchlist, watchlistQuery.data]);

  const featuredCoins = useMemo(
    () =>
      ["bitcoin", "ethereum", "solana"]
        .map((id) => coinsQuery.data?.items.find((coin) => coin.id === id))
        .filter((coin): coin is MarketCoin => Boolean(coin)),
    [coinsQuery.data?.items],
  );

  const marketUniverse = useMemo(
    () =>
      uniqueCoins(
        coinsQuery.data?.items || [],
        watchlistCoinsQuery.data?.items || [],
        featuredCoins,
        gainersQuery.data?.items || [],
        losersQuery.data?.items || [],
      ),
    [coinsQuery.data?.items, featuredCoins, gainersQuery.data?.items, losersQuery.data?.items, watchlistCoinsQuery.data?.items],
  );

  const selectedCoin = useMemo(
    () => marketUniverse.find((coin) => coin.id === selectedCoinId) || featuredCoins[0] || marketUniverse[0] || null,
    [featuredCoins, marketUniverse, selectedCoinId],
  );

  const watchlistCoins = useMemo(
    () => watchlistCoinsQuery.data?.items || [],
    [watchlistCoinsQuery.data?.items],
  );
  const latestUpdated =
    chartQuery.data?.lastUpdated ||
    coinsQuery.data?.lastUpdated ||
    overviewQuery.data?.lastUpdated;

  const portfolioDistribution = useMemo(() => {
    return holdings
      .map((holding) => {
        const coin = marketUniverse.find((item) => item.id === holding.coinId);
        return {
          name: holding.symbol,
          value: (coin?.price || 0) * holding.quantity,
        };
      })
      .filter((entry) => entry.value > 0);
  }, [holdings, marketUniverse]);

  useEffect(() => {
    watchlistCoins.forEach((coin) => {
      alerts.forEach((alert) => {
        if (alert.coinId !== coin.id || alert.triggered) {
          return;
        }
        const reached =
          alert.direction === "above" ? coin.price >= alert.targetPrice : coin.price <= alert.targetPrice;
        if (reached) {
          markAlertTriggered(alert.id);
          toast.success(`${coin.symbol} alert triggered at ${formatMarketCompactCurrency(coin.price, currency)}`);
        }
      });
    });
  }, [alerts, currency, markAlertTriggered, watchlistCoins]);

  const handleToggleWatchlist = (coinId: string) => {
    const next = watchlist.includes(coinId)
      ? watchlist.filter((item) => item !== coinId)
      : [...watchlist, coinId];

    setWatchlist(next);
    watchlistMutation.mutate(
      {
        coinIds: next,
        currency,
      },
      {
        onSuccess: () => {
          toast.success(next.includes(coinId) ? "Added to watchlist" : "Removed from watchlist");
        },
        onError: (error: unknown) => {
          toast.error(error instanceof Error ? error.message : "Failed to sync watchlist");
        },
      },
    );
  };

  const handleAddCompare = (coinId: string) => {
    const next = Array.from(new Set([...compareIds, coinId])).slice(0, 3);
    setCompareCoinIds(next);
  };

  const handleAddHolding = (holding: MarketHolding) => {
    upsertHolding(holding);
    toast.success(`${holding.symbol} holding updated`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Markets"
        subtitle="Professional crypto market analytics with real-time pricing, performance tracking, portfolio P&L, and comparison tooling for BTC, ETH, SOL, and more."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Market Status</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                Live {latestUpdated ? `• ${formatRelativeTime(latestUpdated)}` : ""}
              </div>
            </div>
            <Select value={currency} onValueChange={(value) => setCurrency(value as MarketCurrency)}>
              <SelectTrigger className="w-[8rem]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {MARKET_CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={toggleAutoRefresh}>
              {autoRefresh ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              {autoRefresh ? "Pause Refresh" : "Resume Refresh"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                overviewQuery.refetch();
                coinsQuery.refetch();
                chartQuery.refetch();
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh Now
            </Button>
          </div>
        }
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <LivePriceTicker coins={marketUniverse.slice(0, 8)} currency={currency} lastUpdated={latestUpdated} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
        <MarketOverviewCards overview={overviewQuery.data} currency={currency} loading={overviewQuery.isLoading} />
      </motion.div>

      <motion.div
        className="grid gap-4 xl:grid-cols-3"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36 }}
      >
        {featuredCoins.map((coin) => (
          <FeaturedCoinCard
            key={coin.id}
            coin={coin}
            currency={currency}
            watched={watchlist.includes(coin.id)}
            onViewChart={(coinId) => setSelectedCoinId(coinId)}
            onToggleWatchlist={handleToggleWatchlist}
          />
        ))}
      </motion.div>

      <motion.div
        className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <MainPriceChart
          coins={marketUniverse}
          selectedCoin={selectedCoin}
          detail={selectedCoinDetailQuery.data}
          chart={chartQuery.data}
          currency={currency}
          range={selectedRange}
          chartMode={chartMode}
          autoRefresh={autoRefresh}
          loading={chartQuery.isLoading}
          inWatchlist={watchlist.includes(selectedCoinId)}
          onCoinChange={setSelectedCoinId}
          onRangeChange={setSelectedRange}
          onChartModeChange={setChartMode}
          onRefresh={() => chartQuery.refetch()}
          onToggleWatchlist={() => handleToggleWatchlist(selectedCoinId)}
          onCompare={() => handleAddCompare(selectedCoinId)}
        />
        <div className="space-y-6">
          <WatchlistPanel
            coins={watchlistCoins}
            alerts={alerts}
            currency={currency}
            onOpenCoin={setDrawerCoinId}
            onToggleWatchlist={handleToggleWatchlist}
            onAddAlert={(payload) => {
              addAlert(payload);
              toast.success(`Alert created for ${payload.symbol}`);
            }}
            onRemoveAlert={removeAlert}
          />
          <TopGainersCard items={gainersQuery.data?.items || []} currency={currency} />
          <TopLosersCard items={losersQuery.data?.items || []} currency={currency} />
        </div>
      </motion.div>

      <motion.div
        className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.44 }}
      >
        <ProfitLossCalculator
          coins={marketUniverse}
          currency={currency}
          selectedCoinId={selectedCoinId}
          result={profitLossMutation.data}
          loading={profitLossMutation.isPending}
          onSelectCoin={setSelectedCoinId}
          onCalculate={(payload) => profitLossMutation.mutate(payload)}
        />
        <div id="market-compare">
          <CompareCoinsPanel
            coins={marketUniverse}
            selectedIds={compareIds}
            charts={compareChartsQuery.data || {}}
            onChange={setCompareCoinIds}
          />
        </div>
      </motion.div>

      <motion.div
        className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48 }}
      >
        <PortfolioPnLCard
          holdings={holdings}
          coins={marketUniverse}
          currency={currency}
          onSaveHolding={handleAddHolding}
          onRemoveHolding={removeHolding}
        />
        <PortfolioAllocationChart data={portfolioDistribution} currency={currency} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.52 }}>
        <MarketTable
          coins={coinsQuery.data?.items || []}
          currency={currency}
          loading={coinsQuery.isLoading}
          watchlist={watchlist}
          page={tablePage}
          perPage={coinsQuery.data?.perPage || 25}
          total={coinsQuery.data?.total || 0}
          onView={setDrawerCoinId}
          onToggleWatchlist={handleToggleWatchlist}
          onCompare={handleAddCompare}
          onPageChange={setTablePage}
        />
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel border-white/8 p-5">
          <div className="flex items-center gap-3 text-white">
            <BarChart3 className="h-5 w-5 text-cyan-300" />
            <div className="text-lg font-semibold">Portfolio Summary</div>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            Holdings track live market data and update portfolio totals in real time. Watchlist and alert state persist locally for fast access.
          </div>
        </div>
        <div className="glass-panel border-white/8 p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Current Focus</div>
          <div className="mt-2 text-2xl font-semibold text-white">{selectedCoinDetailQuery.data?.name || selectedCoin?.name || "Bitcoin"}</div>
          <div className="mt-2 text-sm text-slate-400">
            {selectedCoinDetailQuery.data?.sentiment || overviewQuery.data?.sentiment || "Neutral"} sentiment with live range {selectedRange}.
          </div>
        </div>
        <div className="glass-panel border-white/8 p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Watchlist Coverage</div>
          <div className="mt-2 text-2xl font-semibold text-white">{watchlist.length} tracked assets</div>
          <div className="mt-2 text-sm text-slate-400">
            {alerts.length} active price alerts and {compareIds.length} coins in the compare workspace.
          </div>
        </div>
      </div>

      <CoinDetailDrawer
        coin={drawerCoinDetailQuery.data || (drawerCoinId === selectedCoinId ? selectedCoinDetailQuery.data : null)}
        chart={drawerChartQuery.data || (drawerCoinId === selectedCoinId ? chartQuery.data : undefined)}
        currency={currency}
        open={Boolean(drawerCoinId)}
        watched={drawerCoinId ? watchlist.includes(drawerCoinId) : false}
        onOpenChange={(open) => {
          if (!open) {
            setDrawerCoinId(null);
          }
        }}
        onToggleWatchlist={() => {
          if (drawerCoinId) {
            handleToggleWatchlist(drawerCoinId);
          }
        }}
      />
    </div>
  );
}
