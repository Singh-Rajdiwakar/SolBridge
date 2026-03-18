import { z } from "zod";

const portfolioAssetSchema = z.object({
  symbol: z.string().min(2).max(12),
  balance: z.coerce.number().nonnegative().optional(),
  value: z.coerce.number().nonnegative().optional(),
  price: z.coerce.number().nonnegative().optional(),
  change24h: z.coerce.number().optional(),
});

const historyPointSchema = z.object({
  label: z.string().min(1),
  value: z.coerce.number(),
});

export const portfolioAdviceSchema = z.object({
  portfolio: z.array(portfolioAssetSchema).optional(),
  tokenBalances: z.array(portfolioAssetSchema).optional(),
  historicalData: z.array(historyPointSchema).optional(),
}).transform((payload) => ({
  portfolio: payload.portfolio || payload.tokenBalances,
  historicalData: payload.historicalData || [],
}));
