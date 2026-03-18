import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    token: { type: String, required: true },
    amount: { type: Number, required: true },
    receiver: { type: String },
    signature: { type: String },
    status: { type: String, default: "completed" },
    network: { type: String, default: "Devnet" },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
