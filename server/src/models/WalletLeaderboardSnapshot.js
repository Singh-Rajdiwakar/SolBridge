import mongoose from "mongoose";

const walletLeaderboardSnapshotSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, index: true },
    walletAddress: { type: String, required: true, index: true },
    metricValue: { type: Number, required: true },
    rank: { type: Number, required: true },
    period: { type: String, required: true, index: true },
    movement: {
      type: String,
      enum: ["up", "down", "unchanged", "new"],
      default: "new",
    },
  },
  { timestamps: true },
);

walletLeaderboardSnapshotSchema.index({ category: 1, period: 1, rank: 1 });

export const WalletLeaderboardSnapshot =
  mongoose.models.WalletLeaderboardSnapshot || mongoose.model("WalletLeaderboardSnapshot", walletLeaderboardSnapshotSchema);
