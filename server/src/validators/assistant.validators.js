import { z } from "zod";

import { walletAddressSchema } from "./common.validators.js";

export const assistantWalletParamsSchema = z.object({
  walletAddress: walletAddressSchema,
});
