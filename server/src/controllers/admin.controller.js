import { z } from "zod";

import {
  createManualAdminLog,
  createLockPeriod,
  deleteLockPeriod,
  getAdminJobRuns,
  getAdminOverview,
  getAdminUsers,
  getProtocolHealthSummary,
  getSettings,
  getSystemHealth,
  handleEmergencyAction,
  listActivityLogs,
  listLockPeriods,
  updateLockPeriod,
  updateSettings,
} from "../services/admin.service.js";
import { sendSuccess } from "../utils/response.js";

const settingsSchema = z.object({
  rewardRate: z.number().optional(),
  apyType: z.string().optional(),
  poolActive: z.boolean().optional(),
  maxStakeLimit: z.number().optional(),
  poolCapacity: z.number().optional(),
  earlyWithdrawalFee: z.number().optional(),
  autoCompounding: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  claimsFrozen: z.boolean().optional(),
  withdrawalsFrozen: z.boolean().optional(),
});

const lockPeriodSchema = z.object({
  label: z.string().min(2),
  durationDays: z.number().int().positive(),
  apy: z.number().positive(),
  minAmount: z.number().positive(),
  penaltyFee: z.number().min(0),
  enabled: z.boolean(),
});

const emergencySchema = z.object({
  action: z.string().min(2),
  metadata: z.record(z.any()).optional(),
});

const adminLogSchema = z.object({
  action: z.string().min(2),
  module: z.string().min(2).optional(),
  entityType: z.string().min(2).optional(),
  entityId: z.string().min(1).optional(),
  oldValue: z.record(z.any()).optional(),
  newValue: z.record(z.any()).optional(),
  txSignature: z.string().min(8).optional(),
  notes: z.string().max(400).optional(),
  severity: z.string().min(2).optional(),
  meta: z.record(z.any()).optional(),
});

export async function adminSettings(req, res) {
  return sendSuccess(res, await getSettings());
}

export async function saveAdminSettings(req, res) {
  const payload = settingsSchema.parse(req.body);
  return sendSuccess(res, await updateSettings(req.user, payload));
}

export async function getLockPeriods(req, res) {
  return sendSuccess(res, await listLockPeriods());
}

export async function postLockPeriod(req, res) {
  const payload = lockPeriodSchema.parse(req.body);
  return sendSuccess(res, await createLockPeriod(req.user, payload), 201);
}

export async function putLockPeriod(req, res) {
  const payload = lockPeriodSchema.partial().parse(req.body);
  return sendSuccess(res, await updateLockPeriod(req.user, req.params.id, payload));
}

export async function destroyLockPeriod(req, res) {
  await deleteLockPeriod(req.user, req.params.id);
  return sendSuccess(res, { message: "Lock period deleted" });
}

export async function emergencyAction(req, res) {
  const payload = emergencySchema.parse(req.body);
  return sendSuccess(res, await handleEmergencyAction(req.user, payload.action, payload.metadata));
}

export async function activityLogs(req, res) {
  return sendSuccess(res, await listActivityLogs(req.query.query));
}

export async function systemHealth(req, res) {
  return sendSuccess(res, await getSystemHealth());
}

export async function users(req, res) {
  return sendSuccess(res, await getAdminUsers());
}

export async function adminOverview(req, res) {
  return sendSuccess(res, await getAdminOverview());
}

export async function adminJobs(req, res) {
  return sendSuccess(res, await getAdminJobRuns());
}

export async function protocolHealth(req, res) {
  return sendSuccess(res, await getProtocolHealthSummary());
}

export async function postAdminLog(req, res) {
  const payload = adminLogSchema.parse(req.body);
  return sendSuccess(res, await createManualAdminLog(req.user, payload), 201);
}
