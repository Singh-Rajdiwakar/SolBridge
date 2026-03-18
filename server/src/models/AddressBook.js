import mongoose from "mongoose";

const addressBookSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    walletAddress: { type: String, required: true, index: true },
    network: { type: String, default: "Devnet" },
    notes: { type: String, default: "" },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

addressBookSchema.index({ userId: 1, walletAddress: 1 }, { unique: true });

export const AddressBook =
  mongoose.models.AddressBook || mongoose.model("AddressBook", addressBookSchema);
