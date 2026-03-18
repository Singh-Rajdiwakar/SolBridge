import { sendSuccess } from "../utils/response.js";
import { walletAddressParamsSchema } from "../validators/analytics.validators.js";
import {
  listPortfolioSnapshots,
  rebuildPortfolioSnapshot,
} from "../services/portfolio-snapshot.service.js";

export async function getPortfolioSnapshots(req, res) {
  const params = walletAddressParamsSchema.parse(req.params);
  return sendSuccess(res, await listPortfolioSnapshots(params.walletAddress));
}

export async function postPortfolioSnapshotRebuild(req, res) {
  const params = walletAddressParamsSchema.parse({
    walletAddress: req.body.walletAddress,
  });
  return sendSuccess(res, await rebuildPortfolioSnapshot(params.walletAddress), 201);
}
