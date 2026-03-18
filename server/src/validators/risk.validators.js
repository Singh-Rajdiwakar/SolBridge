import { z } from "zod";

import { walletAddressSchema } from "./common.validators.js";

export const riskPathSchema = z.object({
  walletAddress: walletAddressSchema,
});

export const riskTrendQuerySchema = z.object({
  range: z.enum(["7D", "30D", "90D", "1Y"]).default("30D"),
});

export const riskStressScenarioSchema = z.object({
  walletAddress: walletAddressSchema.optional(),
  scenario: z.enum([
    "sol-drop-10",
    "sol-drop-20",
    "lp-divergence-15",
    "borrowed-asset-up-10",
    "stable-buffer",
  ]),
});
