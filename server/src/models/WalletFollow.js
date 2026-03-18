import mongoose from "mongoose";

const walletFollowSchema = new mongoose.Schema(
  {
    followerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    followedWalletAddress: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

walletFollowSchema.index({ followerUserId: 1, followedWalletAddress: 1 }, { unique: true });

export const WalletFollow = mongoose.models.WalletFollow || mongoose.model("WalletFollow", walletFollowSchema);
