import { z } from "zod";

export const gasOptimizeQuerySchema = z.object({
  walletAddress: z.string().min(32).optional(),
});
