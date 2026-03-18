import {
  createWalletAccount,
  ensureWalletAccount,
  importWalletAccount,
} from "../services/wallet-account.service.js";
import {
  airdropWallet,
  createWalletToken,
  getWalletBalance,
  getWalletInsightsSummary,
  getWalletNfts,
  getWalletPortfolio,
  getWalletTransactions,
  sendWalletTransaction,
  swapWallet,
} from "../services/wallet.service.js";
import { sendSuccess } from "../utils/response.js";
import {
  walletAccountCreateSchema,
  walletAccountImportSchema,
  walletAirdropSchema,
  walletBalanceQuerySchema,
  walletCreateTokenSchema,
  walletSendSchema,
  walletSwapSchema,
  walletTransactionsQuerySchema,
} from "../validators/wallet.validators.js";

export async function getAccount(req, res) {
  const payload = walletAccountCreateSchema.parse(req.query);
  const account = await ensureWalletAccount(req.user._id, payload.provider || "Retix Wallet");
  return sendSuccess(res, account);
}

export async function postCreateAccount(req, res) {
  const payload = walletAccountCreateSchema.parse(req.body);
  const account = await createWalletAccount(req.user._id, payload.provider || "Retix Wallet");
  return sendSuccess(res, account, 201);
}

export async function postImportAccount(req, res) {
  const payload = walletAccountImportSchema.parse(req.body);
  const account = await importWalletAccount(req.user._id, payload.privateKey, payload.provider || "Retix Wallet");
  return sendSuccess(res, account, 201);
}

export async function getBalance(req, res) {
  const query = walletBalanceQuerySchema.parse(req.query);
  const balance = await getWalletBalance(req.user._id, query.address, query.provider || "Retix Wallet");
  return sendSuccess(res, balance);
}

export async function getPortfolio(req, res) {
  const query = walletBalanceQuerySchema.parse(req.query);
  const portfolio = await getWalletPortfolio(req.user._id, query.address, query.provider || "Retix Wallet");
  return sendSuccess(res, portfolio);
}

export async function getTransactions(req, res) {
  const query = walletTransactionsQuerySchema.parse(req.query);
  const transactions = await getWalletTransactions(req.user._id, query);
  return sendSuccess(res, transactions);
}

export async function postSend(req, res) {
  const payload = walletSendSchema.parse(req.body);
  const transaction = await sendWalletTransaction(req.user._id, payload);
  return sendSuccess(res, transaction, 201);
}

export async function postCreateToken(req, res) {
  const payload = walletCreateTokenSchema.parse(req.body);
  const result = await createWalletToken(req.user._id, payload);
  return sendSuccess(res, result, 201);
}

export async function postSwap(req, res) {
  const payload = walletSwapSchema.parse(req.body);
  const result = await swapWallet(req.user._id, payload);
  return sendSuccess(res, result, payload.mode === "execute" ? 201 : 200);
}

export async function postAirdrop(req, res) {
  const payload = walletAirdropSchema.parse(req.body);
  const result = await airdropWallet(req.user._id, payload);
  return sendSuccess(res, result, 201);
}

export async function getNfts(req, res) {
  const query = walletBalanceQuerySchema.parse(req.query);
  const result = await getWalletNfts(req.user._id, query.address);
  return sendSuccess(res, result);
}

export async function getInsights(req, res) {
  const query = walletBalanceQuerySchema.parse(req.query);
  const result = await getWalletInsightsSummary(req.user._id, query.address);
  return sendSuccess(res, result);
}
