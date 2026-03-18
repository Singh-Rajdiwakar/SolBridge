import { z } from "zod";

import { walletAddressSchema } from "./common.validators.js";

const base58LikeSchema = z
  .string()
  .min(32)
  .max(128)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 input");

export const explorerWalletParamsSchema = z.object({
  address: walletAddressSchema,
});

export const explorerTransactionParamsSchema = z.object({
  signature: base58LikeSchema,
});

export const explorerTokenParamsSchema = z.object({
  mint: walletAddressSchema,
});

export const explorerBlockParamsSchema = z.object({
  slot: z.coerce.number().int().nonnegative(),
});
