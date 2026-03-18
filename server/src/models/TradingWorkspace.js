import mongoose from "mongoose";

const tradingAlertSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    conditionType: {
      type: String,
      required: true,
      enum: ["above", "below", "smaCross", "percentDrop"],
    },
    targetValue: {
      type: Number,
      required: true,
    },
    indicator: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "triggered", "disabled"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    timestamps: false,
  },
);

const tradingWorkspaceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    watchlistSymbols: {
      type: [String],
      default: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT"],
    },
    alerts: {
      type: [tradingAlertSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export const TradingWorkspace =
  mongoose.models.TradingWorkspace || mongoose.model("TradingWorkspace", tradingWorkspaceSchema);
