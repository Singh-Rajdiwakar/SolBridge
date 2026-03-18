import { sendSuccess } from "../utils/response.js";
import {
  calculateProfitLoss,
  getMarketChart,
  getMarketCoinDetail,
  getMarketsOverview,
  getTopMovers,
  getWatchlist,
  listMarketCoins,
  saveWatchlist,
} from "../services/markets.service.js";
import {
  marketsChartQuerySchema,
  marketsCoinQuerySchema,
  marketsListQuerySchema,
  profitLossSchema,
  watchlistSchema,
} from "../validators/markets.validators.js";

export async function getOverview(req, res) {
  const query = marketsCoinQuerySchema.parse(req.query);
  return sendSuccess(res, await getMarketsOverview(query.currency));
}

export async function getCoins(req, res) {
  const query = marketsListQuerySchema.parse(req.query);
  return sendSuccess(res, await listMarketCoins(query));
}

export async function getCoin(req, res) {
  const query = marketsCoinQuerySchema.parse(req.query);
  return sendSuccess(res, await getMarketCoinDetail(req.params.id, query.currency));
}

export async function getChart(req, res) {
  const query = marketsChartQuerySchema.parse(req.query);
  return sendSuccess(res, await getMarketChart(req.params.id, query.range, query.currency));
}

export async function getGainers(req, res) {
  const query = marketsCoinQuerySchema.parse(req.query);
  return sendSuccess(res, await getTopMovers("gainers", query.currency));
}

export async function getLosers(req, res) {
  const query = marketsCoinQuerySchema.parse(req.query);
  return sendSuccess(res, await getTopMovers("losers", query.currency));
}

export async function postProfitLoss(req, res) {
  const payload = profitLossSchema.parse(req.body);
  return sendSuccess(res, calculateProfitLoss(payload));
}

export async function getUserWatchlist(req, res) {
  return sendSuccess(res, await getWatchlist(req.user._id));
}

export async function postUserWatchlist(req, res) {
  const payload = watchlistSchema.parse(req.body);
  return sendSuccess(res, await saveWatchlist(req.user._id, payload));
}
