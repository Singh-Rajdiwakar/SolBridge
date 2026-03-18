import { sendSuccess } from "../utils/response.js";
import { getAdminSummary, getDashboardSummary } from "../services/dashboard.service.js";
import { walletAddressParamsSchema } from "../validators/analytics.validators.js";
import { AppError } from "../utils/app-error.js";

export async function summary(req, res) {
  const params = walletAddressParamsSchema.parse(req.params);
  const allowedAddresses = new Set([
    req.user.walletAddress,
    ...(req.user.linkedWallets || []).map((wallet) => wallet.address),
  ]);

  if (req.user.role !== "admin" && !allowedAddresses.has(params.walletAddress)) {
    throw new AppError("You can only access dashboard summaries for your linked wallets.", 403);
  }
  return sendSuccess(res, await getDashboardSummary(params.walletAddress));
}

export async function adminSummary(_req, res) {
  return sendSuccess(res, await getAdminSummary());
}
