import mongoose from "mongoose";

const sharedPortfolioSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    walletAddress: { type: String, required: true, index: true },
    title: { type: String, required: true },
    timeframe: { type: String, default: "7D" },
    visibility: {
      type: String,
      enum: ["private", "public", "summary"],
      default: "public",
      index: true,
    },
    summaryData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

sharedPortfolioSnapshotSchema.index({ walletAddress: 1, createdAt: -1 });

export const SharedPortfolioSnapshot =
  mongoose.models.SharedPortfolioSnapshot || mongoose.model("SharedPortfolioSnapshot", sharedPortfolioSnapshotSchema);
