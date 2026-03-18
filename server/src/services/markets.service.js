import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";
import { MarketWatchlist } from "../models/MarketWatchlist.js";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const FEATURED_COIN_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
  "dogecoin",
  "cardano",
  "avalanche-2",
];

const rangeMap = {
  "1H": { days: "1", interval: "5m" },
  "24H": { days: "1", interval: "hourly" },
  "7D": { days: "7" },
  "1M": { days: "30" },
  "3M": { days: "90" },
  "1Y": { days: "365" },
  MAX: { days: "max" },
};

const cache = new Map();

function getCacheKey(path, params) {
  return `${path}?${new URLSearchParams(params).toString()}`;
}

async function fetchCoinGecko(path, params = {}, ttlMs = 15000) {
  const cacheKey = getCacheKey(path, params);
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const url = new URL(`${COINGECKO_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    logger.error("markets.coingecko.error", {
      path,
      status: response.status,
    });
    throw new AppError("Unable to fetch live market data", 502);
  }

  const data = await response.json();
  cache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
  return data;
}

function sentimentFromMarket(coins) {
  const averageChange =
    coins.length > 0
      ? coins.reduce((sum, coin) => sum + (coin.price_change_percentage_24h || 0), 0) / coins.length
      : 0;

  if (averageChange >= 2.5) {
    return "Bullish";
  }
  if (averageChange <= -2.5) {
    return "Bearish";
  }
  return "Neutral";
}

function mapSparkline(prices = []) {
  return prices.slice(-20).map((value, index) => ({
    label: String(index + 1),
    value: Number(value.toFixed(2)),
  }));
}

function mapCoin(coin, currency) {
  return {
    id: coin.id,
    rank: coin.market_cap_rank,
    symbol: coin.symbol?.toUpperCase(),
    name: coin.name,
    image: coin.image,
    price: coin.current_price,
    marketCap: coin.market_cap,
    totalVolume: coin.total_volume,
    high24h: coin.high_24h,
    low24h: coin.low_24h,
    circulatingSupply: coin.circulating_supply,
    priceChange1h: coin.price_change_percentage_1h_in_currency ?? 0,
    priceChange24h: coin.price_change_percentage_24h ?? 0,
    priceChange7d: coin.price_change_percentage_7d_in_currency ?? 0,
    sparkline: mapSparkline(coin.sparkline_in_7d?.price || []),
    ath: coin.ath,
    atl: coin.atl,
    lastUpdated: coin.last_updated,
    currency,
  };
}

function mapChartData(payload, range) {
  const prices = payload.prices || [];
  const marketCaps = payload.market_caps || [];
  const volumes = payload.total_volumes || [];

  return prices.map((entry, index) => {
    const timestamp = entry[0];
    const price = entry[1];
    const previousPrice = prices[index - 1]?.[1] ?? price;
    const nextPrice = prices[index + 1]?.[1] ?? price;
    return {
      timestamp,
      price: Number(price.toFixed(4)),
      marketCap: Number((marketCaps[index]?.[1] || 0).toFixed(2)),
      volume: Number((volumes[index]?.[1] || 0).toFixed(2)),
      open: Number(previousPrice.toFixed(4)),
      high: Number(Math.max(previousPrice, price, nextPrice).toFixed(4)),
      low: Number(Math.min(previousPrice, price, nextPrice).toFixed(4)),
      close: Number(price.toFixed(4)),
      range,
    };
  });
}

export async function getMarketsOverview(currency = "usd") {
  const [globalData, marketCoins] = await Promise.all([
    fetchCoinGecko("/global", {}, 30000),
    fetchCoinGecko(
      "/coins/markets",
      {
        vs_currency: currency,
        ids: FEATURED_COIN_IDS.join(","),
        order: "market_cap_desc",
        sparkline: "true",
        price_change_percentage: "1h,24h,7d",
      },
      15000,
    ),
  ]);

  const mappedCoins = marketCoins.map((coin) => mapCoin(coin, currency));
  const topGainer = [...mappedCoins].sort((a, b) => b.priceChange24h - a.priceChange24h)[0];
  const topLoser = [...mappedCoins].sort((a, b) => a.priceChange24h - b.priceChange24h)[0];

  return {
    marketCap: globalData.data.total_market_cap?.[currency] || 0,
    btcDominance: globalData.data.market_cap_percentage?.btc || 0,
    totalVolume24h: globalData.data.total_volume?.[currency] || 0,
    sentiment: sentimentFromMarket(mappedCoins),
    topGainer,
    topLoser,
    stats: [
      {
        label: "Total Crypto Market Cap",
        value: globalData.data.total_market_cap?.[currency] || 0,
        change: mappedCoins[0]?.priceChange24h || 0,
        sparkline: mappedCoins[0]?.sparkline || [],
      },
      {
        label: "BTC Dominance",
        value: globalData.data.market_cap_percentage?.btc || 0,
        change: mappedCoins.find((coin) => coin.id === "bitcoin")?.priceChange24h || 0,
        sparkline: mappedCoins.find((coin) => coin.id === "bitcoin")?.sparkline || [],
      },
      {
        label: "24h Global Volume",
        value: globalData.data.total_volume?.[currency] || 0,
        change: mappedCoins.find((coin) => coin.id === "ethereum")?.priceChange24h || 0,
        sparkline: mappedCoins.find((coin) => coin.id === "ethereum")?.sparkline || [],
      },
      {
        label: "Market Sentiment",
        value: sentimentFromMarket(mappedCoins),
        change: mappedCoins.find((coin) => coin.id === "solana")?.priceChange24h || 0,
        sparkline: mappedCoins.find((coin) => coin.id === "solana")?.sparkline || [],
      },
      {
        label: "Top Gainer",
        value: topGainer?.symbol || "--",
        change: topGainer?.priceChange24h || 0,
        sparkline: topGainer?.sparkline || [],
      },
      {
        label: "Top Loser",
        value: topLoser?.symbol || "--",
        change: topLoser?.priceChange24h || 0,
        sparkline: topLoser?.sparkline || [],
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

export async function listMarketCoins({ currency = "usd", page = 1, perPage = 50, search, ids }) {
  const payload = await fetchCoinGecko(
    "/coins/markets",
    {
      vs_currency: currency,
      order: "market_cap_desc",
      per_page: perPage,
      page,
      sparkline: "true",
      price_change_percentage: "1h,24h,7d",
      ids,
    },
    5000,
  );

  const mapped = payload.map((coin) => mapCoin(coin, currency));
  const filtered = search
    ? mapped.filter((coin) => {
        const query = search.toLowerCase();
        return coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query);
      })
    : mapped;

  return {
    items: filtered,
    page,
    perPage,
    total: filtered.length,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getMarketCoinDetail(id, currency = "usd") {
  const payload = await fetchCoinGecko(
    `/coins/${id}`,
    {
      localization: "false",
      tickers: "false",
      market_data: "true",
      community_data: "false",
      developer_data: "false",
      sparkline: "true",
    },
    15000,
  );

  const marketData = payload.market_data;
  return {
    id: payload.id,
    symbol: payload.symbol?.toUpperCase(),
    name: payload.name,
    image: payload.image?.large || payload.image?.small,
    description: payload.description?.en || "",
    price: marketData.current_price?.[currency] || 0,
    marketCap: marketData.market_cap?.[currency] || 0,
    totalVolume: marketData.total_volume?.[currency] || 0,
    circulatingSupply: marketData.circulating_supply || 0,
    totalSupply: marketData.total_supply || 0,
    maxSupply: marketData.max_supply || 0,
    high24h: marketData.high_24h?.[currency] || 0,
    low24h: marketData.low_24h?.[currency] || 0,
    ath: marketData.ath?.[currency] || 0,
    atl: marketData.atl?.[currency] || 0,
    athDate: marketData.ath_date?.[currency],
    atlDate: marketData.atl_date?.[currency],
    priceChange24h: marketData.price_change_percentage_24h || 0,
    priceChange7d: marketData.price_change_percentage_7d || 0,
    sentiment: marketData.price_change_percentage_24h > 2 ? "Bullish" : marketData.price_change_percentage_24h < -2 ? "Bearish" : "Neutral",
    sparkline: mapSparkline(marketData.sparkline_7d?.price || []),
    links: payload.links,
    explorers: payload.links?.blockchain_site?.filter(Boolean) || [],
    lastUpdated: payload.last_updated,
  };
}

export async function getMarketChart(id, range = "7D", currency = "usd") {
  const { days, interval } = rangeMap[range] || rangeMap["7D"];
  const payload = await fetchCoinGecko(
    `/coins/${id}/market_chart`,
    {
      vs_currency: currency,
      days,
      ...(interval ? { interval } : {}),
    },
    30000,
  );

  return {
    id,
    range,
    currency,
    points: mapChartData(payload, range),
    lastUpdated: new Date().toISOString(),
  };
}

export async function getTopMovers(type, currency = "usd") {
  const list = await listMarketCoins({ currency, page: 1, perPage: 50 });
  const sorted = [...list.items].sort((a, b) =>
    type === "gainers" ? b.priceChange24h - a.priceChange24h : a.priceChange24h - b.priceChange24h,
  );

  return {
    items: sorted.slice(0, 8),
    lastUpdated: new Date().toISOString(),
  };
}

export function calculateProfitLoss({ buyPrice, currentPrice, quantity }) {
  const investedValue = quantity * buyPrice;
  const currentValue = quantity * currentPrice;
  const pnl = currentValue - investedValue;
  const pnlPercent = investedValue ? (pnl / investedValue) * 100 : 0;

  return {
    investedValue: Number(investedValue.toFixed(2)),
    currentValue: Number(currentValue.toFixed(2)),
    profitLoss: Number(pnl.toFixed(2)),
    profitLossPercent: Number(pnlPercent.toFixed(2)),
  };
}

export async function getWatchlist(userId) {
  const watchlist = await MarketWatchlist.findOne({ userId });
  return watchlist || {
    userId,
    coinIds: ["bitcoin", "ethereum", "solana"],
    currency: "usd",
  };
}

export async function saveWatchlist(userId, payload) {
  return MarketWatchlist.findOneAndUpdate(
    { userId },
    {
      userId,
      coinIds: payload.coinIds,
      ...(payload.currency ? { currency: payload.currency } : {}),
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}
