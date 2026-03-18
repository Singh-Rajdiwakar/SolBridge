import { sendSuccess } from "../utils/response.js";
import {
  getMirroredTransactionBySignature,
  listMirroredTransactions,
  syncMirroredTransactions,
} from "../services/wallet-mirror.service.js";
import {
  transactionMirrorQuerySchema,
  transactionMirrorSyncSchema,
  transactionSignatureParamsSchema,
} from "../validators/transactions.validators.js";
import { AppError } from "../utils/app-error.js";

export async function listTransactions(req, res) {
  const query = transactionMirrorQuerySchema.parse(req.query);
  const allowedAddresses = new Set([
    req.user.walletAddress,
    ...(req.user.linkedWallets || []).map((wallet) => wallet.address),
  ]);
  const walletAddress = query.walletAddress || req.user.walletAddress;

  if (req.user.role !== "admin" && !allowedAddresses.has(walletAddress)) {
    throw new AppError("You can only access mirrored transactions for your linked wallets.", 403);
  }

  return sendSuccess(
    res,
    await listMirroredTransactions({
      ...query,
      userId: req.user.role === "admin" ? undefined : req.user._id,
      walletAddress,
    }),
  );
}

export async function getTransactionBySignature(req, res) {
  const params = transactionSignatureParamsSchema.parse(req.params);
  const record = await getMirroredTransactionBySignature(params.signature);
  const allowedAddresses = new Set([
    req.user.walletAddress,
    ...(req.user.linkedWallets || []).map((wallet) => wallet.address),
  ]);

  if (req.user.role !== "admin" && record.walletAddress && !allowedAddresses.has(record.walletAddress)) {
    throw new AppError("You can only access mirrored transactions for your linked wallets.", 403);
  }

  return sendSuccess(res, record);
}

export async function postTransactionSync(req, res) {
  const payload = transactionMirrorSyncSchema.parse(req.body);
  return sendSuccess(
    res,
    await syncMirroredTransactions({
      walletAddress: payload.walletAddress,
      userId: req.user._id,
      limit: payload.limit,
    }),
    201,
  );
}
