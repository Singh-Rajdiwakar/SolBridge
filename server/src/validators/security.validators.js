import { z } from "zod";

export const securityCheckSchema = z.object({
  walletAddress: z.string().min(32).optional(),
  receiverAddress: z.string().min(32),
  amount: z.coerce.number().positive(),
  token: z.string().min(2).max(12).default("SOL"),
});

export const securityQuerySchema = z.object({
  walletAddress: z.string().min(32).optional(),
});
