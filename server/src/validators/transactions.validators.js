import { z } from "zod";

import { walletAddressSchema } from "./common.validators.js";

export const transactionMirrorQuerySchema = z.object({
  walletAddress: walletAddressSchema.optional(),
  protocolModule: z
    .enum(["staking", "liquidity", "lending", "governance", "wallet", "token", "market", "system", "unknown"])
    .optional(),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const transactionMirrorSyncSchema = z.object({
  walletAddress: walletAddressSchema,
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const transactionSignatureParamsSchema = z.object({
  signature: z.string().min(8),
});
