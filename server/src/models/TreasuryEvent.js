import mongoose from "mongoose";

const treasuryEventSchema = new mongoose.Schema(
  {
    treasuryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreasuryConfig",
      required: true,
      index: true,
    },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    relatedProposal: { type: String, default: "", index: true },
    txSignature: { type: String, default: "", index: true },
    token: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    impact: { type: String, enum: ["low", "medium", "high"], default: "low" },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

treasuryEventSchema.index({ treasuryId: 1, createdAt: -1 });

export const TreasuryEvent =
  mongoose.models.TreasuryEvent || mongoose.model("TreasuryEvent", treasuryEventSchema);
