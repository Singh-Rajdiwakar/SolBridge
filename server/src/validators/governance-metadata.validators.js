import { z } from "zod";

export const governanceMetadataSchema = z.object({
  proposalPubkey: z.string().min(8),
  title: z.string().min(4),
  summary: z.string().max(400).optional().default(""),
  markdownDescription: z.string().max(20000).optional().default(""),
  tags: z.array(z.string().min(1).max(24)).max(12).optional().default([]),
  category: z.string().min(2).max(80).optional().default("General"),
  authorWallet: z.string().min(8).optional().default(""),
  attachments: z.array(z.string().url()).max(12).optional().default([]),
  treasuryRequest: z
    .object({
      amount: z.number().nonnegative().optional().default(0),
      token: z.string().min(2).max(16).optional().default("USDC"),
      category: z.string().min(2).max(80).optional().default(""),
      destination: z.string().max(120).optional().default(""),
      impact: z.string().max(32).optional().default(""),
      conditions: z.string().max(300).optional().default(""),
    })
    .optional(),
});

export const governanceMetadataUpdateSchema = governanceMetadataSchema.partial().omit({
  proposalPubkey: true,
});

export const governanceMetadataParamsSchema = z.object({
  proposalPubkey: z.string().min(8),
});
