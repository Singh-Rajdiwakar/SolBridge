import { connectDatabase, disconnectDatabase } from "../config/db.js";
import {
  rebuildAnalyticsCache,
  runGovernanceSync,
  runMarketSync,
  runNetworkMetricsSync,
  runTransactionSync,
} from "../services/sync.service.js";

const task = process.argv[2];

const runners = {
  markets: runMarketSync,
  network: runNetworkMetricsSync,
  transactions: runTransactionSync,
  governance: runGovernanceSync,
  analytics: rebuildAnalyticsCache,
};

async function run() {
  const runner = runners[task];
  if (!runner) {
    throw new Error(`Unsupported job "${task}"`);
  }

  await connectDatabase();
  const result = await runner();
  console.log(JSON.stringify(result, null, 2));
  await disconnectDatabase();
}

run().catch((error) => {
  console.error("Job failed", error);
  process.exit(1);
});
