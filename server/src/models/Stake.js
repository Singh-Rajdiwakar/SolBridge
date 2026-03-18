import mongoose from "mongoose";

const stakeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenSymbol: { type: String, required: true },
    amount: { type: Number, required: true },
    apy: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    rewardEarned: { type: Number, default: 0 },
    claimedReward: { type: Number, default: 0 },
    status: { type: String, default: "active" },
    startedAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Stake = mongoose.models.Stake || mongoose.model("Stake", stakeSchema);
