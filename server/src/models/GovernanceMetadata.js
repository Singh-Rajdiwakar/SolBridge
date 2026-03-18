import mongoose from "mongoose";

const governanceMetadataSchema = new mongoose.Schema(
  {
    proposalPubkey: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    markdownDescription: { type: String, default: "" },
    tags: { type: [String], default: [] },
    category: { type: String, default: "General" },
    authorWallet: { type: String, default: "" },
    attachments: { type: [String], default: [] },
    treasuryRequest: {
      amount: { type: Number, default: 0 },
      token: { type: String, default: "USDC" },
      category: { type: String, default: "" },
      destination: { type: String, default: "" },
      impact: { type: String, default: "" },
      conditions: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export const GovernanceMetadata =
  mongoose.models.GovernanceMetadata || mongoose.model("GovernanceMetadata", governanceMetadataSchema);
