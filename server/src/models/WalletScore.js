import mongoose from "mongoose";

const walletScoreSchema = new mongoose.Schema(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    score: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    recommendations: { type: [String], default: [] },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const WalletScore =
  mongoose.models.WalletScore || mongoose.model("WalletScore", walletScoreSchema);
