import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema(
  {
    staking: { type: Number, default: 0 },
    liquidity: { type: Number, default: 0 },
    lending: { type: Number, default: 0 },
    hold: { type: Number, default: 0 },
    governance: { type: Number, default: 0 },
    stableReserve: { type: Number, default: 0 },
  },
  { _id: false },
);

const assumptionSchema = new mongoose.Schema(
  {
    stakingToken: { type: String, default: "SOL" },
    liquidityPair: { type: String, default: "SOL/USDC" },
    lendingAsset: { type: String, default: "USDC" },
    governanceToken: { type: String, default: "GOV" },
    stableAsset: { type: String, default: "USDC" },
  },
  { _id: false },
);

const strategyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    allocations: { type: allocationSchema, required: true, default: () => ({}) },
    portfolioCapital: { type: Number, required: true, default: 10000 },
    timeframe: {
      type: String,
      enum: ["30D", "90D", "180D", "1Y"],
      default: "1Y",
    },
    scenario: {
      type: String,
      enum: ["optimistic", "base", "conservative"],
      default: "base",
    },
    assumptions: { type: assumptionSchema, default: () => ({}) },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

strategyPlanSchema.index({ userId: 1, updatedAt: -1 });

export const StrategyPlan =
  mongoose.models.StrategyPlan || mongoose.model("StrategyPlan", strategyPlanSchema);
