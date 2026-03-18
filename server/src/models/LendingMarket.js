import mongoose from "mongoose";

const lendingMarketSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    supplyApr: { type: Number, required: true },
    borrowApr: { type: Number, required: true },
    utilization: { type: Number, required: true },
    collateralFactor: { type: Number, required: true },
    totalSupplied: { type: Number, default: 0 },
    totalBorrowed: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const LendingMarket =
  mongoose.models.LendingMarket || mongoose.model("LendingMarket", lendingMarketSchema);
