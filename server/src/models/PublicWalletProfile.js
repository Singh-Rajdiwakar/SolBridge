import mongoose from "mongoose";

const visibilitySettingsSchema = new mongoose.Schema(
  {
    showPortfolioValue: { type: Boolean, default: true },
    showTokenBalances: { type: Boolean, default: true },
    showPnl: { type: Boolean, default: true },
    showNfts: { type: Boolean, default: true },
    showActivityFeed: { type: Boolean, default: true },
    showBadges: { type: Boolean, default: true },
    showSnapshots: { type: Boolean, default: true },
    showExposure: { type: Boolean, default: true },
    showRisk: { type: Boolean, default: true },
  },
  { _id: false },
);

const publicWalletProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    walletAddress: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, default: "" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    tags: { type: [String], default: [] },
    visibility: {
      type: String,
      enum: ["private", "public", "summary"],
      default: "private",
      index: true,
    },
    isDiscoverable: { type: Boolean, default: false, index: true },
    showInLeaderboards: { type: Boolean, default: false, index: true },
    showInTrending: { type: Boolean, default: false, index: true },
    visibilitySettings: { type: visibilitySettingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

publicWalletProfileSchema.index({
  displayName: "text",
  bio: "text",
  tags: "text",
  walletAddress: "text",
});

export const PublicWalletProfile =
  mongoose.models.PublicWalletProfile || mongoose.model("PublicWalletProfile", publicWalletProfileSchema);
