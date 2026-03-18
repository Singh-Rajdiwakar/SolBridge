import mongoose from "mongoose";

const networkStatusEventSchema = new mongoose.Schema(
  {
    network: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info", index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metricKey: { type: String, default: "" },
    metricValue: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

networkStatusEventSchema.index({ network: 1, createdAt: -1 });

export const NetworkStatusEvent =
  mongoose.models.NetworkStatusEvent ||
  mongoose.model("NetworkStatusEvent", networkStatusEventSchema);
