import { GovernanceMetadata } from "../models/GovernanceMetadata.js";
import { Proposal } from "../models/Proposal.js";
import { runTrackedJob } from "./job-runner.js";

export async function syncGovernanceJob() {
  return runTrackedJob("sync-governance", async () => {
    const [proposalCount, metadataCount] = await Promise.all([
      Proposal.countDocuments(),
      GovernanceMetadata.countDocuments(),
    ]);

    return {
      proposalCount,
      metadataCount,
      source: "governance-mirror",
    };
  });
}
