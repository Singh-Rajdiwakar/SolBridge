import mongoose from "mongoose";

const protocolHealthSnapshotSchema = new mongoose.Schema(
  {
    stakingActive: { type: Boolean, default: true },
    liquidityActive: { type: Boolean, default: true },
    lendingActive: { type: Boolean, default: true },
    governanceActive: { type: Boolean, default: true },
    rpcLatency: { type: Number, default: 0 },
    syncStatus: { type: String, default: "healthy" },
    lastIndexerRun: { type: Date, default: null },
    totalProtocolTx: { type: Number, default: 0 },
  },
  { timestamps: true },
);

protocolHealthSnapshotSchema.index({ createdAt: -1 });

export const ProtocolHealthSnapshot =
  mongoose.models.ProtocolHealthSnapshot ||
  mongoose.model("ProtocolHealthSnapshot", protocolHealthSnapshotSchema);
