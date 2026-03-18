import { recordNetworkSnapshot } from "../services/network.service.js";
import { runTrackedJob } from "./job-runner.js";

export async function snapshotNetworkMetricsJob() {
  return runTrackedJob("snapshot-network-metrics", async () => {
    const snapshot = await recordNetworkSnapshot();

    return {
      snapshotId: snapshot._id,
      recordedAt: snapshot.recordedAt,
      rpcLatency: snapshot.rpcLatency,
      healthScore: snapshot.healthScore,
      tps: snapshot.tps,
    };
  });
}
