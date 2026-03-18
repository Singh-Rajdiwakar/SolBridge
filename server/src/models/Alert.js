import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    walletAddress: { type: String, default: "", index: true },
    type: {
      type: String,
      enum: ["price", "protocol", "security", "governance"],
      required: true,
    },
    target: { type: String, required: true },
    condition: { type: String, required: true },
    threshold: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    triggeredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

alertSchema.index({ userId: 1, enabled: 1, createdAt: -1 });

export const Alert = mongoose.models.Alert || mongoose.model("Alert", alertSchema);
