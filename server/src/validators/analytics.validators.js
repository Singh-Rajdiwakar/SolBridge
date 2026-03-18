import { z } from "zod";

import { walletAddressSchema } from "./common.validators.js";

export const walletAddressParamsSchema = z.object({
  walletAddress: walletAddressSchema,
});
