import mongoose from "mongoose";

const aiAdviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    walletAddress: { type: String, index: true },
    portfolioSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    recommendations: { type: [String], default: [] },
    riskLevel: { type: String, required: true },
    portfolioInsights: { type: [String], default: [] },
    confidence: { type: Number, default: 0 },
    assistantSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    source: { type: String, default: "portfolio-ai" },
  },
  { timestamps: true },
);

aiAdviceSchema.index({ userId: 1, createdAt: -1 });
aiAdviceSchema.index({ userId: 1, walletAddress: 1, createdAt: -1 });

export const AIAdvice = mongoose.models.AIAdvice || mongoose.model("AIAdvice", aiAdviceSchema);
