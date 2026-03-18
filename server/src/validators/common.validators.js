import { z } from "zod";

import { parsePublicKey } from "../services/solana.service.js";

export const walletAddressSchema = z
  .string()
  .min(32)
  .refine((value) => {
    try {
      parsePublicKey(value);
      return true;
    } catch {
      return false;
    }
  }, "Invalid Solana wallet address");

export const objectIdLikeSchema = z.string().min(1);
