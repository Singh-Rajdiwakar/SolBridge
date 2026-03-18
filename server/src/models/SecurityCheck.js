import mongoose from "mongoose";

const securityCheckSchema = new mongoose.Schema(
  {
    walletAddress: { type: String, required: true, index: true },
    receiverAddress: { type: String, required: true, index: true },
    riskLevel: { type: String, required: true },
    confidence: { type: Number, required: true },
    warnings: { type: [String], default: [] },
  },
  { timestamps: true },
);

securityCheckSchema.index({ walletAddress: 1, createdAt: -1 });
securityCheckSchema.index({ receiverAddress: 1, createdAt: -1 });

export const SecurityCheck =
  mongoose.models.SecurityCheck || mongoose.model("SecurityCheck", securityCheckSchema);
