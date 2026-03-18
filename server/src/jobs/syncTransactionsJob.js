import { syncMirroredTransactionsForTrackedWallets } from "../services/wallet-mirror.service.js";
import { runTrackedJob } from "./job-runner.js";

export async function syncTransactionsJob(limit = 20) {
  return runTrackedJob("sync-transactions", async () => syncMirroredTransactionsForTrackedWallets(limit));
}
