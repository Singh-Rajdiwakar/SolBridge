import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    publicKey: { type: String, required: true, unique: true, index: true },
    encryptedPrivateKey: { type: String, required: true, select: false },
    provider: { type: String, default: "Retix Wallet" },
  },
  { timestamps: true },
);

export const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
