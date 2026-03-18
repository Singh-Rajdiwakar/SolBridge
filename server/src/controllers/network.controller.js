import {
  getNetworkBlockTime,
  getNetworkEvents,
  getNetworkFees,
  getNetworkHealth,
  getNetworkOverview,
  getNetworkThroughput,
  getNetworkTps,
  getNetworkValidators,
  getRpcLatencyHistory,
} from "../services/network.service.js";
import { sendSuccess } from "../utils/response.js";
import { networkEventsQuerySchema, networkQuerySchema } from "../validators/network.validators.js";

export async function overview(req, res) {
  const query = networkQuerySchema.parse(req.query);
  return sendSuccess(res, await getNetworkOverview(query.range));
}

export async function tps(req, res) {
  const query = networkQuerySchema.parse(req.query);
  return sendSuccess(res, await getNetworkTps(query.range));
}

export async function blockTime(req, res) {
  const query = networkQuerySchema.parse(req.query);
  return sendSuccess(res, await getNetworkBlockTime(query.range));
}

export async function throughput(req, res) {
  const query = networkQuerySchema.parse(req.query);
  return sendSuccess(res, await getNetworkThroughput(query.range));
}

export async function fees(req, res) {
  const query = networkQuerySchema.parse(req.query);
  return sendSuccess(res, await getNetworkFees(query.range));
}

export async function validators(req, res) {
  const query = networkQuerySchema.parse(req.query);
  return sendSuccess(res, await getNetworkValidators(query.range));
}

export async function rpcLatency(req, res) {
  const query = networkQuerySchema.parse(req.query);
  return sendSuccess(res, await getRpcLatencyHistory(query.range));
}

export async function health(req, res) {
  const query = networkQuerySchema.parse(req.query);
  return sendSuccess(res, await getNetworkHealth(query.range));
}

export async function events(req, res) {
  const query = networkEventsQuerySchema.parse(req.query);
  return sendSuccess(res, await getNetworkEvents(query.limit));
}
