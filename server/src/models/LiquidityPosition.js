import mongoose from "mongoose";

const liquidityPositionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    poolId: { type: mongoose.Schema.Types.ObjectId, ref: "Pool", required: true },
    amountA: { type: Number, required: true },
    amountB: { type: Number, required: true },
    lpTokens: { type: Number, required: true },
    feesEarned: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const LiquidityPosition =
  mongoose.models.LiquidityPosition || mongoose.model("LiquidityPosition", liquidityPositionSchema);
