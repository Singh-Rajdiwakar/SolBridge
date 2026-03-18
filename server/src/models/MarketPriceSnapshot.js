import mongoose from "mongoose";

const marketPriceSnapshotSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    coinId: { type: String, default: "", index: true },
    price: { type: Number, required: true },
    marketCap: { type: Number, default: 0 },
    volume24h: { type: Number, default: 0 },
    change1h: { type: Number, default: 0 },
    change24h: { type: Number, default: 0 },
    change7d: { type: Number, default: 0 },
    fetchedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

marketPriceSnapshotSchema.index({ symbol: 1, fetchedAt: -1 });

export const MarketPriceSnapshot =
  mongoose.models.MarketPriceSnapshot ||
  mongoose.model("MarketPriceSnapshot", marketPriceSnapshotSchema);
