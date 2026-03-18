import { z } from "zod";

import { objectIdLikeSchema, walletAddressSchema } from "./common.validators.js";

const currentYear = new Date().getFullYear();

function parseCsvValue(value) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      String(entry)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    );
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

const csvArraySchema = z.preprocess(parseCsvValue, z.array(z.string()).default([]));

const optionalDateSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
}, z.string().datetime().optional());

export const taxWalletPathSchema = z.object({
  walletAddress: walletAddressSchema,
});

export const taxGroupPathSchema = z.object({
  groupId: objectIdLikeSchema,
});

export const taxQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(currentYear + 1).default(currentYear),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  includeProtocols: csvArraySchema,
  excludeProtocols: csvArraySchema,
  includeTokens: csvArraySchema,
  excludeTokens: csvArraySchema,
});

export const taxExportSchema = z
  .object({
    walletAddress: walletAddressSchema.optional(),
    groupId: objectIdLikeSchema.optional(),
    year: z.coerce.number().int().min(2020).max(currentYear + 1).default(currentYear),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
    includeProtocols: csvArraySchema,
    excludeProtocols: csvArraySchema,
    includeTokens: csvArraySchema,
    excludeTokens: csvArraySchema,
  })
  .superRefine((payload, ctx) => {
    if (!payload.walletAddress && !payload.groupId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "walletAddress or groupId is required",
      });
    }
  });
