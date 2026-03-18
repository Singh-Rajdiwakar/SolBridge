import { z } from "zod";

const supportedIntervals = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
const supportedSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "AVAXUSDT", "DOGEUSDT"];

export const tradingTickerQuerySchema = z.object({
  symbols: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((symbol) => symbol.trim().toUpperCase())
            .filter(Boolean)
        : undefined,
    ),
});

export const tradingCandlesQuerySchema = z.object({
  interval: z.enum(supportedIntervals).optional().default("1h"),
  limit: z.coerce.number().int().min(20).max(500).optional().default(250),
  smaPeriod: z.coerce.number().int().min(2).max(200).optional().default(20),
  emaPeriod: z.coerce.number().int().min(2).max(200).optional().default(21),
  rsiPeriod: z.coerce.number().int().min(2).max(100).optional().default(14),
  macdFast: z.coerce.number().int().min(2).max(50).optional().default(12),
  macdSlow: z.coerce.number().int().min(2).max(100).optional().default(26),
  macdSignal: z.coerce.number().int().min(2).max(50).optional().default(9),
  bbPeriod: z.coerce.number().int().min(2).max(100).optional().default(20),
  bbStdDev: z.coerce.number().min(1).max(5).optional().default(2),
});

export const tradingSymbolParamSchema = z.object({
  symbol: z.enum(supportedSymbols),
});

export const tradingWatchlistSchema = z.object({
  symbols: z.array(z.enum(supportedSymbols)).min(1).max(20),
});

export const tradingAlertSchema = z.object({
  symbol: z.enum(supportedSymbols),
  conditionType: z.enum(["above", "below", "smaCross", "percentDrop"]),
  targetValue: z.coerce.number().positive(),
  indicator: z.string().trim().optional(),
});

export const tradingSimulateTradeSchema = z.object({
  symbol: z.enum(supportedSymbols),
  side: z.enum(["buy", "sell"]),
  quantity: z.coerce.number().positive(),
  entryPrice: z.coerce.number().positive(),
  currentPrice: z.coerce.number().positive(),
  stopLoss: z.coerce.number().positive().optional(),
  takeProfit: z.coerce.number().positive().optional(),
  feeRate: z.coerce.number().min(0).max(0.02).optional().default(0.001),
});

export const tradingCompareQuerySchema = z.object({
  base: z.enum(supportedSymbols),
  target: z.enum(supportedSymbols),
  interval: z.enum(supportedIntervals).optional().default("1h"),
  limit: z.coerce.number().int().min(20).max(500).optional().default(160),
});
