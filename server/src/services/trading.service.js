import { TradingWorkspace } from "../models/TradingWorkspace.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";
import {
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
} from "./indicator.service.js";

const BINANCE_BASE_URL = "https://api.binance.com";
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "AVAXUSDT", "DOGEUSDT"];
const SYMBOL_META = {
  BTCUSDT: { baseAsset: "BTC", quoteAsset: "USDT", coinId: "bitcoin", name: "Bitcoin" },
  ETHUSDT: { baseAsset: "ETH", quoteAsset: "USDT", coinId: "ethereum", name: "Ethereum" },
  SOLUSDT: { baseAsset: "SOL", quoteAsset: "USDT", coinId: "solana", name: "Solana" },
  BNBUSDT: { baseAsset: "BNB", quoteAsset: "USDT", coinId: "binancecoin", name: "BNB" },
  XRPUSDT: { baseAsset: "XRP", quoteAsset: "USDT", coinId: "ripple", name: "XRP" },
  ADAUSDT: { baseAsset: "ADA", quoteAsset: "USDT", coinId: "cardano", name: "Cardano" },
  AVAXUSDT: { baseAsset: "AVAX", quoteAsset: "USDT", coinId: "avalanche-2", name: "Avalanche" },
  DOGEUSDT: { baseAsset: "DOGE", quoteAsset: "USDT", coinId: "dogecoin", name: "Dogecoin" },
};

const cache = new Map();

function toNumber(value, digits = 8) {
  return Number(Number(value || 0).toFixed(digits));
}

function getCacheKey(source, params) {
  return `${source}:${JSON.stringify(params)}`;
}

async function fetchJson(url, cacheKey, ttlMs = 10000) {
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    logger.error("trading.fetch.error", {
      url,
      status: response.status,
    });
    throw new AppError("Unable to fetch trading market data", 502);
  }

  const data = await response.json();
  cache.set(cacheKey, {
    value: data,
    expiresAt: Date.now() + ttlMs,
  });
  return data;
}

function getSymbolMeta(symbol) {
  const meta = SYMBOL_META[symbol];
  if (!meta) {
    throw new AppError(`Unsupported trading symbol: ${symbol}`, 400);
  }
  return meta;
}

function normalizeSymbols(symbols) {
  return (symbols?.length ? symbols : DEFAULT_SYMBOLS).filter((symbol) => SYMBOL_META[symbol]);
}

async function fetchCoinMetadata(symbols) {
  const ids = normalizeSymbols(symbols).map((symbol) => getSymbolMeta(symbol).coinId);
  const url = new URL(`${COINGECKO_BASE_URL}/coins/markets`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("sparkline", "false");
  url.searchParams.set("price_change_percentage", "24h");

  let payload = [];
  try {
    payload = await fetchJson(url.toString(), getCacheKey("coingecko:markets", ids), 15000);
  } catch (error) {
    logger.warn("trading.metadata.fallback", {
      source: "coingecko",
      ids,
      message: error instanceof Error ? error.message : String(error),
    });
    payload = [];
  }

  return payload.reduce((accumulator, item) => {
    accumulator[item.symbol?.toUpperCase()] = item;
    return accumulator;
  }, {});
}

async function fetchTickerPayload(symbols) {
  const resolved = normalizeSymbols(symbols);
  const url = new URL(`${BINANCE_BASE_URL}/api/v3/ticker/24hr`);
  if (resolved.length === 1) {
    url.searchParams.set("symbol", resolved[0]);
  } else {
    url.searchParams.set("symbols", JSON.stringify(resolved));
  }

  const payload = await fetchJson(url.toString(), getCacheKey("binance:ticker", resolved), 4000);
  return Array.isArray(payload) ? payload : [payload];
}

async function fetchSparkline(symbol) {
  const url = new URL(`${BINANCE_BASE_URL}/api/v3/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", "1h");
  url.searchParams.set("limit", "24");
  const payload = await fetchJson(url.toString(), getCacheKey("binance:sparkline", { symbol }), 10000);
  return payload.map((entry, index) => ({
    label: String(index + 1),
    value: toNumber(entry[4], 4),
  }));
}

function mapTickerItem(item, metadata, sparkline) {
  const meta = getSymbolMeta(item.symbol);
  const cg = metadata[meta.baseAsset];
  return {
    symbol: item.symbol,
    baseAsset: meta.baseAsset,
    quoteAsset: meta.quoteAsset,
    name: meta.name,
    image: cg?.image || null,
    lastPrice: toNumber(item.lastPrice, 4),
    priceChangePercent: toNumber(item.priceChangePercent, 2),
    priceChange: toNumber(item.priceChange, 4),
    highPrice: toNumber(item.highPrice, 4),
    lowPrice: toNumber(item.lowPrice, 4),
    volume: toNumber(item.volume, 4),
    quoteVolume: toNumber(item.quoteVolume, 2),
    weightedAvgPrice: toNumber(item.weightedAvgPrice, 4),
    tradeCount: Number(item.count || 0),
    marketCap: cg?.market_cap || 0,
    circulatingSupply: cg?.circulating_supply || 0,
    ath: cg?.ath || 0,
    atl: cg?.atl || 0,
    sparkline,
  };
}

export async function getTradingTicker(symbols) {
  const resolved = normalizeSymbols(symbols);
  const [tickerPayload, metadata, sparklines] = await Promise.all([
    fetchTickerPayload(resolved),
    fetchCoinMetadata(resolved),
    Promise.all(
      resolved.map(async (symbol) => {
        try {
          return await fetchSparkline(symbol);
        } catch (error) {
          logger.warn("trading.sparkline.fallback", {
            symbol,
            message: error instanceof Error ? error.message : String(error),
          });
          return [];
        }
      }),
    ),
  ]);

  const items = tickerPayload
    .map((item, index) => mapTickerItem(item, metadata, sparklines[index]))
    .sort((a, b) => resolved.indexOf(a.symbol) - resolved.indexOf(b.symbol));

  const topGainers = [...items]
    .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
    .slice(0, 4);
  const topLosers = [...items]
    .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
    .slice(0, 4);
  const mostActive = [...items]
    .sort((a, b) => b.tradeCount - a.tradeCount)
    .slice(0, 4);
  const highestVolume = [...items]
    .sort((a, b) => b.quoteVolume - a.quoteVolume)
    .slice(0, 4);

  return {
    items,
    topGainers,
    topLosers,
    mostActive,
    highestVolume,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getTradingCandles(symbol, interval = "1h", limit = 250, indicatorConfig = {}) {
  getSymbolMeta(symbol);

  const url = new URL(`${BINANCE_BASE_URL}/api/v3/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));

  const payload = await fetchJson(
    url.toString(),
    getCacheKey("binance:klines", { symbol, interval, limit }),
    6000,
  );

  const candles = payload.map((entry) => ({
    time: Math.floor(entry[0] / 1000),
    openTime: entry[0],
    closeTime: entry[6],
    open: toNumber(entry[1], 4),
    high: toNumber(entry[2], 4),
    low: toNumber(entry[3], 4),
    close: toNumber(entry[4], 4),
    volume: toNumber(entry[5], 4),
    quoteVolume: toNumber(entry[7], 2),
    trades: Number(entry[8] || 0),
    isBullish: Number(entry[4]) >= Number(entry[1]),
  }));

  const sma = calculateSMA(candles, indicatorConfig.smaPeriod);
  const ema = calculateEMA(candles, indicatorConfig.emaPeriod);
  const rsi = calculateRSI(candles, indicatorConfig.rsiPeriod);
  const macd = calculateMACD(
    candles,
    indicatorConfig.macdFast,
    indicatorConfig.macdSlow,
    indicatorConfig.macdSignal,
  );
  const bollinger = calculateBollingerBands(
    candles,
    indicatorConfig.bbPeriod,
    indicatorConfig.bbStdDev,
  );

  return {
    symbol,
    interval,
    candles,
    indicators: {
      sma,
      ema,
      rsi,
      macd,
      bollinger,
      volumeMa: calculateSMA(
        candles.map((candle) => ({ ...candle, close: candle.volume })),
        indicatorConfig.smaPeriod,
      ),
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function getTradingMarketStats(symbol) {
  const ticker = await getTradingTicker([symbol]);
  const item = ticker.items[0];
  if (!item) {
    throw new AppError("Trading symbol not found", 404);
  }

  const volatility = item.lastPrice
    ? ((item.highPrice - item.lowPrice) / item.lastPrice) * 100
    : 0;

  return {
    ...item,
    trend:
      item.priceChangePercent > 1.2
        ? "Bullish"
        : item.priceChangePercent < -1.2
          ? "Bearish"
          : "Neutral",
    volatilityScore: toNumber(volatility, 2),
    liveStatus: "Live",
    networkStatus: "Market data synchronized",
  };
}

export async function getTradingWorkspace(userId) {
  const workspace = await TradingWorkspace.findOne({ userId });
  if (workspace) {
    return workspace;
  }

  return {
    userId,
    watchlistSymbols: DEFAULT_SYMBOLS.slice(0, 7),
    alerts: [],
  };
}

export async function saveTradingWatchlist(userId, symbols) {
  return TradingWorkspace.findOneAndUpdate(
    { userId },
    {
      userId,
      watchlistSymbols: symbols,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}

export async function createTradingAlert(userId, payload) {
  const workspace = await TradingWorkspace.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        watchlistSymbols: DEFAULT_SYMBOLS.slice(0, 7),
      },
      $push: {
        alerts: payload,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return workspace.alerts.at(-1);
}

export async function deleteTradingAlert(userId, alertId) {
  const workspace = await TradingWorkspace.findOneAndUpdate(
    { userId },
    {
      $pull: {
        alerts: { _id: alertId },
      },
    },
    { new: true },
  );

  return workspace?.alerts || [];
}

export async function getTradingAlerts(userId) {
  const workspace = await getTradingWorkspace(userId);
  return workspace.alerts || [];
}

export function simulateTrade(payload) {
  const notional = payload.entryPrice * payload.quantity;
  const feeEstimate = notional * payload.feeRate;
  const currentNotional = payload.currentPrice * payload.quantity;
  const unrealizedPnl =
    payload.side === "buy" ? currentNotional - notional : notional - currentNotional;
  const roiPercent = notional ? (unrealizedPnl / notional) * 100 : 0;
  const stopLossRisk = payload.stopLoss
    ? Math.abs(payload.entryPrice - payload.stopLoss) * payload.quantity
    : 0;
  const takeProfitReward = payload.takeProfit
    ? Math.abs(payload.takeProfit - payload.entryPrice) * payload.quantity
    : 0;

  return {
    symbol: payload.symbol,
    side: payload.side,
    quantity: payload.quantity,
    entryPrice: payload.entryPrice,
    currentPrice: payload.currentPrice,
    feeEstimate: toNumber(feeEstimate, 4),
    totalCost: toNumber(notional + feeEstimate, 4),
    unrealizedPnl: toNumber(unrealizedPnl, 4),
    roiPercent: toNumber(roiPercent, 2),
    estimatedProfit: toNumber(takeProfitReward - feeEstimate, 4),
    estimatedLoss: toNumber(stopLossRisk + feeEstimate, 4),
    riskRewardRatio: stopLossRisk ? toNumber(takeProfitReward / stopLossRisk, 2) : 0,
    marker: {
      time: Math.floor(Date.now() / 1000),
      price: payload.entryPrice,
      side: payload.side,
      text: `${payload.side === "buy" ? "Buy" : "Sell"} ${payload.quantity}`,
    },
  };
}

function normalizePerformance(candles) {
  const first = candles[0]?.close || 1;
  return candles.map((candle) => ({
    time: candle.time,
    value: toNumber(((candle.close / first) - 1) * 100, 2),
  }));
}

function calculateVolatility(candles) {
  if (candles.length < 2) {
    return 0;
  }

  const returns = candles.slice(1).map((candle, index) => {
    const prev = candles[index].close || 1;
    return (candle.close - prev) / prev;
  });

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return toNumber(Math.sqrt(variance) * 100, 2);
}

export async function getTradingCompare(base, target, interval, limit = 160) {
  const [baseCandles, targetCandles, baseStats, targetStats] = await Promise.all([
    getTradingCandles(base, interval, limit, {
      smaPeriod: 20,
      emaPeriod: 21,
      rsiPeriod: 14,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
      bbPeriod: 20,
      bbStdDev: 2,
    }),
    getTradingCandles(target, interval, limit, {
      smaPeriod: 20,
      emaPeriod: 21,
      rsiPeriod: 14,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
      bbPeriod: 20,
      bbStdDev: 2,
    }),
    getTradingMarketStats(base),
    getTradingMarketStats(target),
  ]);

  return {
    base: {
      symbol: base,
      series: normalizePerformance(baseCandles.candles),
      volatility: calculateVolatility(baseCandles.candles),
      marketCap: baseStats.marketCap,
      priceChangePercent: baseStats.priceChangePercent,
    },
    target: {
      symbol: target,
      series: normalizePerformance(targetCandles.candles),
      volatility: calculateVolatility(targetCandles.candles),
      marketCap: targetStats.marketCap,
      priceChangePercent: targetStats.priceChangePercent,
    },
    interval,
    lastUpdated: new Date().toISOString(),
  };
}
