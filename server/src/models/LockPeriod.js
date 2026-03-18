import mongoose from "mongoose";

const lockPeriodSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    durationDays: { type: Number, required: true },
    apy: { type: Number, required: true },
    minAmount: { type: Number, required: true },
    penaltyFee: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const LockPeriod =
  mongoose.models.LockPeriod || mongoose.model("LockPeriod", lockPeriodSchema);
