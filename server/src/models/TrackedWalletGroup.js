import mongoose from "mongoose";

const trackedWalletEntrySchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    label: { type: String, default: "" },
    type: {
      type: String,
      enum: ["personal", "trading", "staking", "treasury", "watch-only"],
      default: "personal",
    },
    notes: { type: String, default: "" },
    isFavorite: { type: Boolean, default: false },
    isPrimary: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const trackedWalletGroupSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    wallets: { type: [trackedWalletEntrySchema], default: [] },
  },
  { timestamps: true },
);

trackedWalletGroupSchema.index({ userId: 1, createdAt: -1 });

export const TrackedWalletGroup =
  mongoose.models.TrackedWalletGroup ||
  mongoose.model("TrackedWalletGroup", trackedWalletGroupSchema);
