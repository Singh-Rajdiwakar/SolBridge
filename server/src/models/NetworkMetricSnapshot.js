import mongoose from "mongoose";

const networkMetricSnapshotSchema = new mongoose.Schema(
  {
    network: { type: String, required: true, index: true },
    endpointLabel: { type: String, required: true },
    endpointUrl: { type: String, required: true },
    tps: { type: Number, default: 0 },
    recentAverageTps: { type: Number, default: 0 },
    peakTps: { type: Number, default: 0 },
    blockTime: { type: Number, default: 0 },
    throughput: { type: Number, default: 0 },
    avgFee: { type: Number, default: 0 },
    validatorCount: { type: Number, default: 0 },
    activeValidators: { type: Number, default: 0 },
    delinquentValidators: { type: Number, default: 0 },
    rpcLatency: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
    slot: { type: Number, default: 0 },
    blockHeight: { type: Number, default: 0 },
    version: { type: String, default: "" },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

networkMetricSnapshotSchema.index({ network: 1, recordedAt: -1 });

export const NetworkMetricSnapshot =
  mongoose.models.NetworkMetricSnapshot ||
  mongoose.model("NetworkMetricSnapshot", networkMetricSnapshotSchema);
