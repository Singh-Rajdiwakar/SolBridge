import { computeProtocolAnalyticsJob } from "../jobs/computeProtocolAnalyticsJob.js";
import { snapshotPortfolioJob } from "../jobs/snapshotPortfolioJob.js";
import { snapshotNetworkMetricsJob } from "../jobs/snapshotNetworkMetricsJob.js";
import { syncGovernanceJob } from "../jobs/syncGovernanceJob.js";
import { syncMarketPricesJob } from "../jobs/syncMarketPricesJob.js";
import { syncTransactionsJob } from "../jobs/syncTransactionsJob.js";
import { JobRunLog } from "../models/JobRunLog.js";

export async function runMarketSync() {
  return syncMarketPricesJob();
}

export async function runTransactionSync() {
  return syncTransactionsJob();
}

export async function runGovernanceSync() {
  return syncGovernanceJob();
}

export async function runPortfolioSnapshots() {
  return snapshotPortfolioJob();
}

export async function runNetworkMetricsSync() {
  return snapshotNetworkMetricsJob();
}

export async function rebuildAnalyticsCache() {
  const [markets, transactions, governance, portfolio, protocol, network] = await Promise.all([
    syncMarketPricesJob(),
    syncTransactionsJob(),
    syncGovernanceJob(),
    snapshotPortfolioJob(),
    computeProtocolAnalyticsJob(),
    snapshotNetworkMetricsJob(),
  ]);

  return {
    markets,
    transactions,
    governance,
    portfolio,
    protocol,
    network,
  };
}

export async function listRecentJobRuns() {
  return JobRunLog.find().sort({ createdAt: -1 }).limit(25).lean();
}
