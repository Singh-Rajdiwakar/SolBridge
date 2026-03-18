import { z } from "zod";

import { objectIdLikeSchema } from "./common.validators.js";

const percentSchema = z.coerce.number().min(0).max(100);
const timeframeSchema = z.enum(["30D", "90D", "180D", "1Y"]);
const scenarioSchema = z.enum(["optimistic", "base", "conservative"]);

export const strategyAllocationSchema = z
  .object({
    staking: percentSchema.default(0),
    liquidity: percentSchema.default(0),
    lending: percentSchema.default(0),
    hold: percentSchema.default(0),
    governance: percentSchema.default(0),
    stableReserve: percentSchema.default(0),
  })
  .refine(
    (value) =>
      Math.round(
        Object.values(value).reduce((sum, entry) => sum + Number(entry || 0), 0) * 100,
      ) / 100 === 100,
    "Strategy allocations must total 100%",
  );

export const strategyAssumptionsSchema = z.object({
  stakingToken: z.string().trim().max(24).optional(),
  liquidityPair: z.string().trim().max(24).optional(),
  lendingAsset: z.string().trim().max(24).optional(),
  governanceToken: z.string().trim().max(24).optional(),
  stableAsset: z.string().trim().max(24).optional(),
});

export const strategyPlanCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  allocations: strategyAllocationSchema,
  portfolioCapital: z.coerce.number().min(100).max(100000000),
  timeframe: timeframeSchema.default("1Y"),
  scenario: scenarioSchema.default("base"),
  assumptions: strategyAssumptionsSchema.optional().default({}),
  notes: z.string().trim().max(480).optional().default(""),
});

export const strategyPlanUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  allocations: strategyAllocationSchema.optional(),
  portfolioCapital: z.coerce.number().min(100).max(100000000).optional(),
  timeframe: timeframeSchema.optional(),
  scenario: scenarioSchema.optional(),
  assumptions: strategyAssumptionsSchema.optional(),
  notes: z.string().trim().max(480).optional(),
});

export const strategyPlanParamsSchema = z.object({
  strategyId: objectIdLikeSchema,
});

export const strategySimulationInputSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  allocations: strategyAllocationSchema,
  portfolioCapital: z.coerce.number().min(100).max(100000000),
  timeframe: timeframeSchema.default("1Y"),
  scenario: scenarioSchema.default("base"),
  assumptions: strategyAssumptionsSchema.optional().default({}),
  notes: z.string().trim().max(480).optional().default(""),
});

export const strategyCompareSchema = z.object({
  strategyIds: z.array(objectIdLikeSchema).max(5).optional().default([]),
  strategies: z
    .array(
      strategySimulationInputSchema.extend({
        strategyId: objectIdLikeSchema.optional(),
      }),
    )
    .max(5)
    .optional()
    .default([]),
});
