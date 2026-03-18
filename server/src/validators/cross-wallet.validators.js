import { z } from "zod";

import { objectIdLikeSchema, walletAddressSchema } from "./common.validators.js";

const trackedWalletTypeSchema = z.enum(["personal", "trading", "staking", "treasury", "watch-only"]);

export const trackedWalletEntrySchema = z.object({
  address: walletAddressSchema,
  label: z.string().trim().min(1).max(64).optional(),
  type: trackedWalletTypeSchema.optional().default("personal"),
  notes: z.string().trim().max(240).optional(),
  isFavorite: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
});

export const trackedWalletGroupCreateSchema = z.object({
  name: z.string().trim().min(2).max(64),
  wallets: z.array(trackedWalletEntrySchema).max(25).optional().default([]),
});

export const trackedWalletGroupUpdateSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
  wallets: z.array(trackedWalletEntrySchema).max(25).optional(),
});

export const trackedWalletGroupParamsSchema = z.object({
  groupId: objectIdLikeSchema,
});

export const crossWalletExportSchema = z.object({
  format: z.enum(["csv", "json"]).optional().default("json"),
});
