import { sendSuccess } from "../utils/response.js";
import {
  createTrackedWalletGroup,
  deleteTrackedWalletGroup,
  exportCrossWalletData,
  getCrossWalletActivity,
  getCrossWalletDiversity,
  getCrossWalletPnl,
  getCrossWalletRisk,
  getCrossWalletSummary,
  listTrackedWalletGroups,
  updateTrackedWalletGroup,
} from "../services/cross-wallet.service.js";
import {
  crossWalletExportSchema,
  trackedWalletGroupCreateSchema,
  trackedWalletGroupParamsSchema,
  trackedWalletGroupUpdateSchema,
} from "../validators/cross-wallet.validators.js";

export async function listGroups(req, res) {
  return sendSuccess(res, await listTrackedWalletGroups(req.user._id));
}

export async function createGroup(req, res) {
  const payload = trackedWalletGroupCreateSchema.parse(req.body);
  return sendSuccess(res, await createTrackedWalletGroup(req.user._id, payload), 201);
}

export async function updateGroup(req, res) {
  const params = trackedWalletGroupParamsSchema.parse(req.params);
  const payload = trackedWalletGroupUpdateSchema.parse(req.body);
  return sendSuccess(res, await updateTrackedWalletGroup(req.user._id, params.groupId, payload));
}

export async function deleteGroup(req, res) {
  const params = trackedWalletGroupParamsSchema.parse(req.params);
  return sendSuccess(res, await deleteTrackedWalletGroup(req.user._id, params.groupId));
}

export async function summary(req, res) {
  const params = trackedWalletGroupParamsSchema.parse(req.params);
  return sendSuccess(res, await getCrossWalletSummary(req.user._id, params.groupId));
}

export async function pnl(req, res) {
  const params = trackedWalletGroupParamsSchema.parse(req.params);
  return sendSuccess(res, await getCrossWalletPnl(req.user._id, params.groupId));
}

export async function risk(req, res) {
  const params = trackedWalletGroupParamsSchema.parse(req.params);
  return sendSuccess(res, await getCrossWalletRisk(req.user._id, params.groupId));
}

export async function diversity(req, res) {
  const params = trackedWalletGroupParamsSchema.parse(req.params);
  return sendSuccess(res, await getCrossWalletDiversity(req.user._id, params.groupId));
}

export async function activity(req, res) {
  const params = trackedWalletGroupParamsSchema.parse(req.params);
  return sendSuccess(res, await getCrossWalletActivity(req.user._id, params.groupId));
}

export async function whaleSignals(req, res) {
  const params = trackedWalletGroupParamsSchema.parse(req.params);
  return sendSuccess(res, await getCrossWalletWhaleSignals(req.user._id, params.groupId));
}

export async function exportGroup(req, res) {
  const params = trackedWalletGroupParamsSchema.parse(req.params);
  const payload = crossWalletExportSchema.parse(req.body);
  return sendSuccess(res, await exportCrossWalletData(req.user._id, params.groupId, payload.format));
}
