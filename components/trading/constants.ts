import type { TradingInterval, TradingSymbol } from "@/types";

export const TRADING_SYMBOLS: TradingSymbol[] = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "DOGEUSDT",
];

export const TRADING_INTERVALS: TradingInterval[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

export const SYMBOL_LABELS: Record<TradingSymbol, string> = {
  BTCUSDT: "BTC/USDT",
  ETHUSDT: "ETH/USDT",
  SOLUSDT: "SOL/USDT",
  BNBUSDT: "BNB/USDT",
  XRPUSDT: "XRP/USDT",
  ADAUSDT: "ADA/USDT",
  AVAXUSDT: "AVAX/USDT",
  DOGEUSDT: "DOGE/USDT",
};
