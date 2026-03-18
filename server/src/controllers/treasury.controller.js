import { sendSuccess } from "../utils/response.js";
import {
  getTreasuryAllocation,
  getTreasuryAssets,
  getTreasuryEvents,
  getTreasuryFlows,
  getTreasuryGrowth,
  getTreasuryHealth,
  getTreasuryOverview,
  getTreasuryRunway,
  getTreasurySpendingProposals,
} from "../services/treasury.service.js";
import { treasuryRangeSchema } from "../validators/treasury.validators.js";

export async function treasuryOverview(_req, res) {
  return sendSuccess(res, await getTreasuryOverview());
}

export async function treasuryAssets(_req, res) {
  return sendSuccess(res, await getTreasuryAssets());
}

export async function treasuryAllocation(_req, res) {
  return sendSuccess(res, await getTreasuryAllocation());
}

export async function treasuryGrowth(req, res) {
  const query = treasuryRangeSchema.parse(req.query);
  return sendSuccess(res, await getTreasuryGrowth(query.range));
}

export async function treasuryHealth(_req, res) {
  return sendSuccess(res, await getTreasuryHealth());
}

export async function treasuryRunway(_req, res) {
  return sendSuccess(res, await getTreasuryRunway());
}

export async function treasuryProposals(_req, res) {
  return sendSuccess(res, await getTreasurySpendingProposals());
}

export async function treasuryFlows(_req, res) {
  return sendSuccess(res, await getTreasuryFlows());
}

export async function treasuryEvents(_req, res) {
  return sendSuccess(res, await getTreasuryEvents());
}
