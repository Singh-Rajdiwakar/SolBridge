import { MarketPriceSnapshot } from "../models/MarketPriceSnapshot.js";
import { getMarketsOverview, listMarketCoins } from "./markets.service.js";

const DEFAULT_SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX"];

export async function syncMarketPriceSnapshots(currency = "usd") {
  const marketCoins = await listMarketCoins({
    currency,
    page: 1,
    perPage: 40,
  });

  const trackedItems = marketCoins.items.filter((coin) => DEFAULT_SYMBOLS.includes(coin.symbol));

  const writes = trackedItems.map((coin) =>
    MarketPriceSnapshot.create({
      symbol: coin.symbol,
      coinId: coin.id,
      price: coin.price,
      marketCap: coin.marketCap,
      volume24h: coin.totalVolume,
      change1h: coin.priceChange1h,
      change24h: coin.priceChange24h,
      change7d: coin.priceChange7d,
      fetchedAt: new Date(),
    }),
  );

  await Promise.all(writes);

  return {
    currency,
    synced: trackedItems.length,
    symbols: trackedItems.map((item) => item.symbol),
    fetchedAt: new Date().toISOString(),
  };
}

export async function getCachedMarketCoins(symbols = DEFAULT_SYMBOLS) {
  const snapshots = await Promise.all(
    symbols.map(async (symbol) =>
      MarketPriceSnapshot.findOne({ symbol }).sort({ fetchedAt: -1 }).lean(),
    ),
  );

  return snapshots.filter(Boolean);
}

export async function getCachedMarketOverview(currency = "usd") {
  const [overview, cachedCoins] = await Promise.all([
    getMarketsOverview(currency).catch(() => null),
    getCachedMarketCoins(),
  ]);

  if (overview) {
    return {
      ...overview,
      source: "live-with-cache",
      cachedCoins,
    };
  }

  return {
    marketCap: cachedCoins.reduce((sum, item) => sum + (item.marketCap || 0), 0),
    btcDominance: 0,
    totalVolume24h: cachedCoins.reduce((sum, item) => sum + (item.volume24h || 0), 0),
    sentiment: "Cached",
    stats: cachedCoins.map((item) => ({
      label: item.symbol,
      value: item.price,
      change: item.change24h,
      sparkline: [],
    })),
    lastUpdated: cachedCoins[0]?.fetchedAt || null,
    source: "cache",
    cachedCoins,
  };
}

export async function getCachedMarketCoin(symbol) {
  return MarketPriceSnapshot.findOne({ symbol: symbol.toUpperCase() }).sort({ fetchedAt: -1 }).lean();
}
