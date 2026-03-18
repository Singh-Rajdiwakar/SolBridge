import mongoose from "mongoose";

const walletBadgeSchema = new mongoose.Schema(
  {
    walletAddress: { type: String, required: true, index: true },
    badgeKey: { type: String, required: true },
    badgeLabel: { type: String, required: true },
    reason: { type: String, default: "" },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

walletBadgeSchema.index({ walletAddress: 1, badgeKey: 1 }, { unique: true });

export const WalletBadge = mongoose.models.WalletBadge || mongoose.model("WalletBadge", walletBadgeSchema);
