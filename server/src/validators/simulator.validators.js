import { z } from "zod";

export const transactionSimulationSchema = z.object({
  kind: z.enum(["send", "swap"]).optional(),
  walletAddress: z.string().min(32).optional(),
  receiverAddress: z.string().min(32).optional(),
  token: z.string().min(2).max(12).optional(),
  amount: z.coerce.number().positive(),
  fromToken: z.string().min(2).max(12).optional(),
  toToken: z.string().min(2).max(12).optional(),
  slippage: z.coerce.number().min(0).max(5).optional(),
}).superRefine((payload, context) => {
  const kind = payload.kind || (payload.fromToken && payload.toToken ? "swap" : "send");

  if (kind === "send" && !payload.receiverAddress) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Receiver address is required for send simulation",
      path: ["receiverAddress"],
    });
  }

  if (kind === "swap" && (!payload.fromToken || !payload.toToken)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Swap simulation requires fromToken and toToken",
      path: ["fromToken"],
    });
  }
});
