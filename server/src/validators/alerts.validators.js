import { z } from "zod";

import { walletAddressSchema } from "./common.validators.js";

export const alertSchema = z.object({
  walletAddress: walletAddressSchema.optional(),
  type: z.enum(["price", "protocol", "security", "governance"]),
  target: z.string().min(1).max(120),
  condition: z.string().min(1).max(120),
  threshold: z.coerce.number().optional().default(0),
  enabled: z.boolean().optional().default(true),
});

export const alertUpdateSchema = alertSchema.partial();

export const alertParamsSchema = z.object({
  id: z.string().min(1),
});
