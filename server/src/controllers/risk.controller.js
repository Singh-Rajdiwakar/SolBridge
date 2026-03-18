import { sendSuccess } from "../utils/response.js";
import {
  riskPathSchema,
  riskStressScenarioSchema,
  riskTrendQuerySchema,
} from "../validators/risk.validators.js";
import {
  getRiskBreakdown,
  getRiskEvents,
  getRiskRecommendations,
  getRiskSummary,
  getRiskTrend,
  stressTestPortfolioRisk,
} from "../services/risk.service.js";

export async function summary(req, res) {
  const params = riskPathSchema.parse(req.params);
  return sendSuccess(res, await getRiskSummary(req.user._id, params.walletAddress));
}

export async function breakdown(req, res) {
  const params = riskPathSchema.parse(req.params);
  return sendSuccess(res, await getRiskBreakdown(req.user._id, params.walletAddress));
}

export async function trend(req, res) {
  const params = riskPathSchema.parse(req.params);
  const query = riskTrendQuerySchema.parse(req.query);
  return sendSuccess(res, await getRiskTrend(req.user._id, params.walletAddress, query.range));
}

export async function stressTest(req, res) {
  const payload = riskStressScenarioSchema.parse(req.body);
  return sendSuccess(res, await stressTestPortfolioRisk(req.user._id, payload));
}

export async function events(req, res) {
  const params = riskPathSchema.parse(req.params);
  return sendSuccess(res, await getRiskEvents(req.user._id, params.walletAddress));
}

export async function recommendations(req, res) {
  const params = riskPathSchema.parse(req.params);
  return sendSuccess(res, await getRiskRecommendations(req.user._id, params.walletAddress));
}
