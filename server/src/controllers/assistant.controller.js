import {
  getAssistantHistory,
  getAssistantInsights,
  getAssistantOpportunities,
  getAssistantRebalancing,
  getAssistantRiskWarnings,
  getAssistantSummary,
  getAssistantYieldSuggestions,
  refreshAssistantInsights,
} from "../services/assistant.service.js";
import { sendSuccess } from "../utils/response.js";
import { assistantWalletParamsSchema } from "../validators/assistant.validators.js";

function parseWalletAddress(params) {
  return assistantWalletParamsSchema.parse(params).walletAddress;
}

export async function summary(req, res) {
  return sendSuccess(res, await getAssistantSummary(req.user._id, parseWalletAddress(req.params)));
}

export async function insights(req, res) {
  return sendSuccess(res, await getAssistantInsights(req.user._id, parseWalletAddress(req.params)));
}

export async function yieldSuggestions(req, res) {
  return sendSuccess(res, await getAssistantYieldSuggestions(req.user._id, parseWalletAddress(req.params)));
}

export async function riskWarnings(req, res) {
  return sendSuccess(res, await getAssistantRiskWarnings(req.user._id, parseWalletAddress(req.params)));
}

export async function rebalancing(req, res) {
  return sendSuccess(res, await getAssistantRebalancing(req.user._id, parseWalletAddress(req.params)));
}

export async function opportunities(req, res) {
  return sendSuccess(res, await getAssistantOpportunities(req.user._id, parseWalletAddress(req.params)));
}

export async function history(req, res) {
  return sendSuccess(res, await getAssistantHistory(req.user._id, parseWalletAddress(req.params)));
}

export async function refresh(req, res) {
  return sendSuccess(res, await refreshAssistantInsights(req.user._id, parseWalletAddress(req.params)));
}
