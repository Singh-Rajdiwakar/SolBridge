import { sendSuccess } from "../utils/response.js";
import {
  createTradingAlert,
  deleteTradingAlert,
  getTradingAlerts,
  getTradingCandles,
  getTradingCompare,
  getTradingMarketStats,
  getTradingTicker,
  getTradingWorkspace,
  saveTradingWatchlist,
  simulateTrade,
} from "../services/trading.service.js";
import {
  tradingAlertSchema,
  tradingCandlesQuerySchema,
  tradingCompareQuerySchema,
  tradingSimulateTradeSchema,
  tradingSymbolParamSchema,
  tradingTickerQuerySchema,
  tradingWatchlistSchema,
} from "../validators/trading.validators.js";

export async function getTicker(req, res) {
  const query = tradingTickerQuerySchema.parse(req.query);
  return sendSuccess(res, await getTradingTicker(query.symbols));
}

export async function getCandles(req, res) {
  const params = tradingSymbolParamSchema.parse(req.params);
  const query = tradingCandlesQuerySchema.parse(req.query);
  return sendSuccess(
    res,
    await getTradingCandles(params.symbol, query.interval, query.limit, query),
  );
}

export async function getMarketStats(req, res) {
  const params = tradingSymbolParamSchema.parse(req.params);
  return sendSuccess(res, await getTradingMarketStats(params.symbol));
}

export async function getWatchlist(req, res) {
  return sendSuccess(res, await getTradingWorkspace(req.user._id));
}

export async function postWatchlist(req, res) {
  const payload = tradingWatchlistSchema.parse(req.body);
  return sendSuccess(res, await saveTradingWatchlist(req.user._id, payload.symbols));
}

export async function postSimulateTrade(req, res) {
  const payload = tradingSimulateTradeSchema.parse(req.body);
  return sendSuccess(res, simulateTrade(payload));
}

export async function getAlerts(req, res) {
  return sendSuccess(res, await getTradingAlerts(req.user._id));
}

export async function postAlert(req, res) {
  const payload = tradingAlertSchema.parse(req.body);
  return sendSuccess(res, await createTradingAlert(req.user._id, payload));
}

export async function removeAlert(req, res) {
  return sendSuccess(res, await deleteTradingAlert(req.user._id, req.params.id));
}

export async function getCompare(req, res) {
  const query = tradingCompareQuerySchema.parse(req.query);
  return sendSuccess(res, await getTradingCompare(query.base, query.target, query.interval, query.limit));
}
