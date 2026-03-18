import mongoose from "mongoose";

const lendingAssetSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    amount: { type: Number, required: true },
    value: { type: Number, required: true },
  },
  { _id: false },
);

const lendingPositionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    suppliedAssets: { type: [lendingAssetSchema], default: [] },
    borrowedAssets: { type: [lendingAssetSchema], default: [] },
    healthFactor: { type: Number, default: 999 },
    collateralValue: { type: Number, default: 0 },
    borrowValue: { type: Number, default: 0 },
    availableBorrow: { type: Number, default: 0 },
    liquidationThreshold: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const LendingPosition =
  mongoose.models.LendingPosition || mongoose.model("LendingPosition", lendingPositionSchema);
