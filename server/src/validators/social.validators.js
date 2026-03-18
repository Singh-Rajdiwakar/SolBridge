import { z } from "zod";

import { walletAddressSchema } from "./common.validators.js";

const visibilitySchema = z.enum(["private", "public", "summary"]);

export const socialWalletParamsSchema = z.object({
  walletAddress: walletAddressSchema,
});

export const socialProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(2).max(48).optional(),
  avatar: z.string().trim().url().or(z.literal("")).optional(),
  bio: z.string().trim().max(280).optional(),
  tags: z.array(z.string().trim().min(2).max(24)).max(8).optional(),
  visibility: visibilitySchema.optional(),
  isDiscoverable: z.boolean().optional(),
  showInLeaderboards: z.boolean().optional(),
  showInTrending: z.boolean().optional(),
  visibilitySettings: z
    .object({
      showPortfolioValue: z.boolean().optional(),
      showTokenBalances: z.boolean().optional(),
      showPnl: z.boolean().optional(),
      showNfts: z.boolean().optional(),
      showActivityFeed: z.boolean().optional(),
      showBadges: z.boolean().optional(),
      showSnapshots: z.boolean().optional(),
      showExposure: z.boolean().optional(),
      showRisk: z.boolean().optional(),
    })
    .optional(),
});

export const socialLeaderboardsQuerySchema = z.object({
  period: z.enum(["today", "7d", "30d", "all"]).optional().default("7d"),
});

export const socialTrendingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).optional().default(8),
});

export const socialSearchQuerySchema = z.object({
  q: z.string().trim().max(64).optional().default(""),
  tag: z.string().trim().max(24).optional(),
  badge: z.string().trim().max(48).optional(),
  sort: z.enum(["trending", "followers", "value"]).optional().default("trending"),
});

export const socialSnapshotCreateSchema = z.object({
  walletAddress: walletAddressSchema,
  title: z.string().trim().min(2).max(72),
  timeframe: z.enum(["24H", "7D", "30D", "90D", "1Y"]).optional().default("7D"),
  visibility: visibilitySchema.optional().default("public"),
  includePortfolioValue: z.boolean().optional().default(true),
  includePnl: z.boolean().optional().default(true),
  includeAllocation: z.boolean().optional().default(true),
  includeRiskScore: z.boolean().optional().default(true),
});

export const socialFeedQuerySchema = z.object({
  walletAddress: walletAddressSchema.optional(),
  scope: z.enum(["global", "wallet"]).optional().default("global"),
});
