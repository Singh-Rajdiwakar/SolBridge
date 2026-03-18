import mongoose from "mongoose";

const tokenBreakdownSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    amount: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    value: { type: Number, default: 0 },
    allocationPercent: { type: Number, default: 0 },
  },
  { _id: false },
);

const portfolioSnapshotSchema = new mongoose.Schema(
  {
    walletAddress: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    totalValue: { type: Number, required: true },
    totalInvested: { type: Number, default: 0 },
    pnl: { type: Number, default: 0 },
    tokenBreakdown: { type: [tokenBreakdownSchema], default: [] },
    takenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

portfolioSnapshotSchema.index({ walletAddress: 1, takenAt: -1 });

export const PortfolioSnapshot =
  mongoose.models.PortfolioSnapshot || mongoose.model("PortfolioSnapshot", portfolioSnapshotSchema);
