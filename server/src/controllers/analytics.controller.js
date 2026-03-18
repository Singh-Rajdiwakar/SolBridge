import { sendSuccess } from "../utils/response.js";
import {
  getGovernanceAnalytics,
  getLendingAnalytics,
  getLiquidityAnalytics,
  getProtocolAnalytics,
  getStakingAnalytics,
  getWalletAnalytics,
} from "../services/analytics.service.js";
import { walletAddressParamsSchema } from "../validators/analytics.validators.js";
import { AppError } from "../utils/app-error.js";

function assertWalletAccess(user, walletAddress) {
  const linkedWallets = new Set([user.walletAddress, ...(user.linkedWallets || []).map((wallet) => wallet.address)]);
  if (user.role !== "admin" && !linkedWallets.has(walletAddress)) {
    throw new AppError("You can only access analytics for your linked wallets.", 403);
  }
}

export async function walletAnalytics(req, res) {
  const params = walletAddressParamsSchema.parse(req.params);
  assertWalletAccess(req.user, params.walletAddress);
  return sendSuccess(res, await getWalletAnalytics(params.walletAddress));
}

export async function stakingAnalytics(req, res) {
  const params = walletAddressParamsSchema.parse(req.params);
  assertWalletAccess(req.user, params.walletAddress);
  return sendSuccess(res, await getStakingAnalytics(params.walletAddress));
}

export async function liquidityAnalytics(req, res) {
  const params = walletAddressParamsSchema.parse(req.params);
  assertWalletAccess(req.user, params.walletAddress);
  return sendSuccess(res, await getLiquidityAnalytics(params.walletAddress));
}

export async function lendingAnalytics(req, res) {
  const params = walletAddressParamsSchema.parse(req.params);
  assertWalletAccess(req.user, params.walletAddress);
  return sendSuccess(res, await getLendingAnalytics(params.walletAddress));
}

export async function governanceAnalytics(req, res) {
  const params = walletAddressParamsSchema.parse(req.params);
  assertWalletAccess(req.user, params.walletAddress);
  return sendSuccess(res, await getGovernanceAnalytics(params.walletAddress));
}

export async function protocolAnalytics(_req, res) {
  return sendSuccess(res, await getProtocolAnalytics());
}
