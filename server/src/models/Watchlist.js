import mongoose from "mongoose";

const watchlistItemSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    coinId: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [watchlistItemSchema], default: [] },
  },
  { timestamps: true },
);

export const Watchlist = mongoose.models.Watchlist || mongoose.model("Watchlist", watchlistSchema);
