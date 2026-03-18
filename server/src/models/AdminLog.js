import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    adminWallet: { type: String, default: "", index: true },
    action: { type: String, required: true },
    module: { type: String, default: "admin", index: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    txSignature: { type: String, default: "", index: true },
    notes: { type: String, default: "" },
    severity: { type: String, default: "info" },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

adminLogSchema.index({ module: 1, createdAt: -1 });
adminLogSchema.index({ adminUserId: 1, createdAt: -1 });

export const AdminLog = mongoose.models.AdminLog || mongoose.model("AdminLog", adminLogSchema);
