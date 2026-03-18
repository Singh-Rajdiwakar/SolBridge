import mongoose from "mongoose";

const treasuryWalletSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: ["main", "rewards", "grants", "liquidity", "governance", "operations"],
      default: "main",
    },
    notes: { type: String, default: "" },
  },
  { _id: false },
);

const treasuryCategoryRuleSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, trim: true, uppercase: true },
    category: {
      type: String,
      enum: [
        "liquid reserves",
        "stable reserves",
        "governance reserves",
        "ecosystem incentives",
        "protocol-owned liquidity",
        "reward reserves",
      ],
      required: true,
    },
    tags: { type: [String], default: [] },
  },
  { _id: false },
);

const treasuryConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    wallets: { type: [treasuryWalletSchema], default: [] },
    categoryRules: { type: [treasuryCategoryRuleSchema], default: [] },
    monthlyOutflowEstimate: { type: Number, default: 18000 },
    rewardFundingMonthly: { type: Number, default: 7200 },
    grantsCommitmentMonthly: { type: Number, default: 5400 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

treasuryConfigSchema.index({ isActive: 1, updatedAt: -1 });

export const TreasuryConfig =
  mongoose.models.TreasuryConfig || mongoose.model("TreasuryConfig", treasuryConfigSchema);
