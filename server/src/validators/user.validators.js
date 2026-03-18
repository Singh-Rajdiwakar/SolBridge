import { z } from "zod";

import { walletAddressSchema } from "./common.validators.js";

export const userWatchlistCreateSchema = z.object({
  symbol: z.string().min(1).max(12).transform((value) => value.toUpperCase()),
  coinId: z.string().min(1).max(64),
});

export const userPreferencesSchema = z.object({
  favoriteCoins: z.array(z.string().min(1).max(12)).max(20).optional(),
  chartTimeframe: z.enum(["1H", "24H", "7D", "1M", "3M", "1Y", "MAX"]).optional(),
  selectedCurrency: z.enum(["usd", "inr", "krw"]).optional(),
  sidebarCollapsed: z.boolean().optional(),
  themeMode: z.enum(["dark", "light", "system"]).optional(),
  defaultDashboardTab: z.string().min(1).max(64).optional(),
  marketView: z.string().min(1).max(64).optional(),
  watchlistLayout: z.enum(["grid", "list", "compact"]).optional(),
  autoRefreshEnabled: z.boolean().optional(),
});

export const linkedWalletSchema = z.object({
  address: walletAddressSchema,
  provider: z.enum(["retix", "phantom", "solflare", "backpack"]),
  label: z.string().max(48).optional(),
  notes: z.string().max(240).optional(),
  favorite: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
});

export const userProfileUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  avatar: z.string().max(400).optional(),
  preferredNetwork: z.enum(["devnet", "mainnet-beta", "testnet"]).optional(),
});

export const watchlistSymbolParamsSchema = z.object({
  symbol: z.string().min(1).max(12).transform((value) => value.toUpperCase()),
});
