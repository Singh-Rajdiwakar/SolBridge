import { User } from "../models/User.js";
import { rebuildPortfolioSnapshot } from "../services/portfolio-snapshot.service.js";
import { runTrackedJob } from "./job-runner.js";

export async function snapshotPortfolioJob() {
  return runTrackedJob("snapshot-portfolio", async () => {
    const users = await User.find({}, "walletAddress").lean();
    const snapshots = [];

    for (const user of users) {
      if (!user.walletAddress) {
        continue;
      }

      const snapshot = await rebuildPortfolioSnapshot(user.walletAddress).catch(() => null);
      if (snapshot) {
        snapshots.push(snapshot.walletAddress);
      }
    }

    return {
      wallets: snapshots.length,
      walletAddresses: snapshots,
    };
  });
}
