import { z } from "zod";

export const addressBookCreateSchema = z.object({
  name: z.string().min(2),
  walletAddress: z.string().min(32),
  network: z.string().min(2).default("Devnet"),
  notes: z.string().max(300).optional(),
});

export const addressBookUpdateSchema = addressBookCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  {
    message: "At least one field is required for update",
  },
);
