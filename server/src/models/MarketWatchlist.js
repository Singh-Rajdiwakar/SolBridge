import mongoose from "mongoose";

const marketWatchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    coinIds: {
      type: [String],
      default: ["bitcoin", "ethereum", "solana"],
    },
    currency: {
      type: String,
      default: "usd",
    },
  },
  { timestamps: true },
);

export const MarketWatchlist =
  mongoose.models.MarketWatchlist || mongoose.model("MarketWatchlist", marketWatchlistSchema);
