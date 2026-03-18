import { sendSuccess } from "../utils/response.js";
import {
  getBlockExplorerData,
  getTokenMintExplorerData,
  getTransactionExplorerData,
  getTransactionFlowData,
  getWalletExplorerData,
  getWalletInteractionGraph,
} from "../services/explorer.service.js";
import {
  explorerBlockParamsSchema,
  explorerTokenParamsSchema,
  explorerTransactionParamsSchema,
  explorerWalletParamsSchema,
} from "../validators/explorer.validators.js";

export async function getExplorerWallet(req, res) {
  const { address } = explorerWalletParamsSchema.parse(req.params);
  return sendSuccess(res, await getWalletExplorerData(address, req.user));
}

export async function getExplorerTransaction(req, res) {
  const { signature } = explorerTransactionParamsSchema.parse(req.params);
  return sendSuccess(res, await getTransactionExplorerData(signature, req.user));
}

export async function getExplorerToken(req, res) {
  const { mint } = explorerTokenParamsSchema.parse(req.params);
  return sendSuccess(res, await getTokenMintExplorerData(mint));
}

export async function getExplorerBlock(req, res) {
  const { slot } = explorerBlockParamsSchema.parse(req.params);
  return sendSuccess(res, await getBlockExplorerData(slot));
}

export async function getExplorerWalletGraph(req, res) {
  const { address } = explorerWalletParamsSchema.parse(req.params);
  return sendSuccess(res, await getWalletInteractionGraph(address, req.user));
}

export async function getExplorerTransactionFlow(req, res) {
  const { signature } = explorerTransactionParamsSchema.parse(req.params);
  return sendSuccess(res, await getTransactionFlowData(signature, req.user));
}
