import { z } from "zod";

export const walletBalanceQuerySchema = z.object({
  address: z.string().min(32).optional(),
  provider: z.string().optional(),
});

export const walletTransactionsQuerySchema = z.object({
  address: z.string().min(32).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const walletSendSchema = z.object({
  address: z.string().min(32).optional(),
  receiver: z.string().min(32).optional(),
  receiverAddress: z.string().min(32).optional(),
  token: z.string().min(2).max(12).optional(),
  amount: z.number().positive(),
  signature: z.string().min(32).optional(),
  provider: z.string().optional(),
  note: z.string().max(240).optional(),
}).refine((payload) => Boolean(payload.receiver || payload.receiverAddress), {
  message: "Receiver address is required",
  path: ["receiverAddress"],
});

export const walletCreateTokenSchema = z.object({
  address: z.string().min(32).optional(),
  mintAddress: z.string().min(32).optional(),
  signature: z.string().min(32).optional(),
  name: z.string().min(2),
  symbol: z.string().min(2).max(10),
  decimals: z.number().int().min(0).max(9),
  initialSupply: z.number().positive().optional(),
  supply: z.number().positive().optional(),
  provider: z.string().optional(),
}).transform((payload) => ({
  ...payload,
  initialSupply: payload.initialSupply ?? payload.supply,
}));

export const walletAirdropSchema = z.object({
  address: z.string().min(32).optional(),
  amount: z.number().positive().max(2).optional(),
});

export const walletSwapSchema = z.object({
  address: z.string().min(32).optional(),
  fromToken: z.string().min(2).max(10),
  toToken: z.string().min(2).max(10),
  amount: z.number().positive(),
  slippage: z.number().min(0).max(5).optional(),
  mode: z.enum(["preview", "execute"]).optional(),
  provider: z.string().optional(),
});

export const walletAccountCreateSchema = z.object({
  provider: z.string().optional(),
});

export const walletAccountImportSchema = z.object({
  privateKey: z.string().min(16),
  provider: z.string().optional(),
});
