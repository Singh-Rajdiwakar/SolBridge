import mongoose from "mongoose";

const adminSettingSchema = new mongoose.Schema(
  {
    rewardRate: { type: Number, default: 14.2 },
    apyType: { type: String, default: "dynamic" },
    poolActive: { type: Boolean, default: true },
    maxStakeLimit: { type: Number, default: 250000 },
    poolCapacity: { type: Number, default: 2000000 },
    earlyWithdrawalFee: { type: Number, default: 2.5 },
    autoCompounding: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    claimsFrozen: { type: Boolean, default: false },
    withdrawalsFrozen: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const AdminSetting =
  mongoose.models.AdminSetting || mongoose.model("AdminSetting", adminSettingSchema);
