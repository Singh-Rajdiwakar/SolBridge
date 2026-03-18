import {
  analyzeTransactionRisk,
  getWalletAlerts,
} from "../services/security.service.js";
import { getWalletScoreForAddress } from "../services/wallet-score.service.js";
import { sendSuccess } from "../utils/response.js";
import {
  securityCheckSchema,
  securityQuerySchema,
} from "../validators/security.validators.js";

export async function checkTransaction(req, res) {
  const payload = securityCheckSchema.parse(req.body);
  const result = await analyzeTransactionRisk({
    userId: req.user._id,
    ...payload,
  });
  return sendSuccess(res, result);
}

export async function walletScore(req, res) {
  const query = securityQuerySchema.parse(req.query);
  const result = await getWalletScoreForAddress(
    req.user._id,
    query.walletAddress || req.user.walletAddress,
  );
  return sendSuccess(res, result);
}

export async function alerts(req, res) {
  const query = securityQuerySchema.parse(req.query);
  const result = await getWalletAlerts({
    userId: req.user._id,
    walletAddress: query.walletAddress || req.user.walletAddress,
  });
  return sendSuccess(res, result);
}
