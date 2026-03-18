import { z } from "zod";

export const networkRangeSchema = z.enum(["1H", "24H", "7D", "30D"]).default("24H");

export const networkQuerySchema = z.object({
  range: networkRangeSchema.optional(),
});

export const networkEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
