import { z } from "zod";

export const treasuryRangeSchema = z.object({
  range: z.enum(["7D", "30D", "90D", "1Y", "ALL"]).optional().default("30D"),
});
