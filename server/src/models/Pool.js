import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: Number, required: true },
  },
  { _id: false },
);

const poolSchema = new mongoose.Schema(
  {
    pair: { type: String, required: true, unique: true },
    tokenA: { type: String, required: true },
    tokenB: { type: String, required: true },
    totalLiquidity: { type: Number, required: true },
    apr: { type: Number, required: true },
    volume24h: { type: Number, required: true },
    feePercent: { type: Number, required: true },
    priceImpact: { type: Number, default: 0.1 },
    tvlHistory: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

export const Pool = mongoose.models.Pool || mongoose.model("Pool", poolSchema);
