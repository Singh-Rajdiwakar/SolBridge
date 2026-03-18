import { ProtocolHealthSnapshot } from "../models/ProtocolHealthSnapshot.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { getRpcLatency } from "../services/solana.service.js";
import { runTrackedJob } from "./job-runner.js";

export async function computeProtocolAnalyticsJob() {
  return runTrackedJob("compute-protocol-analytics", async () => {
    const [rpcLatency, totalProtocolTx] = await Promise.all([
      getRpcLatency().catch(() => 0),
      TransactionMirror.countDocuments(),
    ]);

    const snapshot = await ProtocolHealthSnapshot.create({
      stakingActive: true,
      liquidityActive: true,
      lendingActive: true,
      governanceActive: true,
      rpcLatency,
      syncStatus: rpcLatency > 0 && rpcLatency < 1200 ? "healthy" : "degraded",
      lastIndexerRun: new Date(),
      totalProtocolTx,
    });

    return {
      snapshotId: snapshot._id,
      rpcLatency,
      totalProtocolTx,
    };
  });
}
