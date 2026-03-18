import mongoose from "mongoose";

const transactionMirrorSchema = new mongoose.Schema(
  {
    walletAddress: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    signature: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    protocolModule: {
      type: String,
      enum: ["staking", "liquidity", "lending", "governance", "wallet", "token", "market", "system", "unknown"],
      default: "unknown",
      index: true,
    },
    tokenSymbol: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    fromAddress: { type: String, default: "" },
    toAddress: { type: String, default: "" },
    status: { type: String, default: "confirmed", index: true },
    slot: { type: Number, default: 0 },
    blockTime: { type: Date, index: true },
    explorerUrl: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

transactionMirrorSchema.index({ walletAddress: 1, createdAt: -1 });
transactionMirrorSchema.index({ walletAddress: 1, protocolModule: 1, createdAt: -1 });

export const TransactionMirror =
  mongoose.models.TransactionMirror || mongoose.model("TransactionMirror", transactionMirrorSchema);
