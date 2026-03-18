import { z } from "zod";

const supportedCurrencies = ["usd", "inr", "krw"];
const supportedRanges = ["1H", "24H", "7D", "1M", "3M", "1Y", "MAX"];

export const marketsListQuerySchema = z.object({
  currency: z.enum(supportedCurrencies).optional().default("usd"),
  page: z.coerce.number().int().positive().max(10).optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().trim().optional(),
  ids: z.string().trim().optional(),
});

export const marketsCoinQuerySchema = z.object({
  currency: z.enum(supportedCurrencies).optional().default("usd"),
});

export const marketsChartQuerySchema = z.object({
  currency: z.enum(supportedCurrencies).optional().default("usd"),
  range: z.enum(supportedRanges).optional().default("7D"),
});

export const profitLossSchema = z.object({
  buyPrice: z.coerce.number().positive(),
  currentPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().positive(),
});

export const watchlistSchema = z.object({
  currency: z.enum(supportedCurrencies).optional(),
  coinIds: z.array(z.string().min(1)).min(1).max(20),
});
