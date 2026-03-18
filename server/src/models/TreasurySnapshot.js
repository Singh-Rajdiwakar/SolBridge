import mongoose from "mongoose";

const treasuryTokenBreakdownSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    balance: { type: Number, default: 0 },
    value: { type: Number, default: 0 },
    allocationPercent: { type: Number, default: 0 },
    category: { type: String, default: "liquid reserves" },
  },
  { _id: false },
);

const treasuryCategoryBreakdownSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    value: { type: Number, default: 0 },
    allocationPercent: { type: Number, default: 0 },
  },
  { _id: false },
);

const treasurySnapshotSchema = new mongoose.Schema(
  {
    treasuryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreasuryConfig",
      required: true,
      index: true,
    },
    totalValue: { type: Number, required: true, default: 0 },
    tokenBreakdown: { type: [treasuryTokenBreakdownSchema], default: [] },
    categoryBreakdown: { type: [treasuryCategoryBreakdownSchema], default: [] },
    liquidAssets: { type: Number, default: 0 },
    committedAssets: { type: Number, default: 0 },
    inflows: { type: Number, default: 0 },
    outflows: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

treasurySnapshotSchema.index({ treasuryId: 1, recordedAt: -1 });

export const TreasurySnapshot =
  mongoose.models.TreasurySnapshot || mongoose.model("TreasurySnapshot", treasurySnapshotSchema);
