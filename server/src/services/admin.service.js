import { AdminSetting } from "../models/AdminSetting.js";
import { JobRunLog } from "../models/JobRunLog.js";
import { LendingMarket } from "../models/LendingMarket.js";
import { LockPeriod } from "../models/LockPeriod.js";
import { ProtocolHealthSnapshot } from "../models/ProtocolHealthSnapshot.js";
import { Stake } from "../models/Stake.js";
import { Transaction } from "../models/Transaction.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { calculatePendingStakeReward } from "../utils/tokens.js";
import { getRpcLatency } from "./solana.service.js";
import { getNetworkOverview } from "./network.service.js";

import { createAdminLog } from "./admin-log.service.js";

export async function getSettings() {
  const settings = await AdminSetting.findOne();
  if (settings) {
    return settings;
  }
  return AdminSetting.create({});
}

export async function updateSettings(admin, payload) {
  const settings = await getSettings();
  const previousValue = settings.toObject();

  Object.assign(settings, payload);
  await settings.save();

  await createAdminLog({
    adminId: admin._id,
    action: "Settings Updated",
    entityType: "AdminSetting",
    entityId: settings._id.toString(),
    oldValue: previousValue,
    newValue: settings.toObject(),
    severity: "warning",
  });

  return settings;
}

export async function listLockPeriods() {
  return LockPeriod.find().sort({ durationDays: 1 });
}

export async function createLockPeriod(admin, payload) {
  const period = await LockPeriod.create(payload);
  await createAdminLog({
    adminId: admin._id,
    action: "Lock Period Created",
    entityType: "LockPeriod",
    entityId: period._id.toString(),
    newValue: period.toObject(),
    severity: "info",
  });
  return period;
}

export async function updateLockPeriod(admin, id, payload) {
  const period = await LockPeriod.findById(id);
  if (!period) {
    throw new AppError("Lock period not found", 404);
  }
  const previousValue = period.toObject();
  Object.assign(period, payload);
  await period.save();
  await createAdminLog({
    adminId: admin._id,
    action: "Lock Period Updated",
    entityType: "LockPeriod",
    entityId: period._id.toString(),
    oldValue: previousValue,
    newValue: period.toObject(),
    severity: "warning",
  });
  return period;
}

export async function deleteLockPeriod(admin, id) {
  const period = await LockPeriod.findById(id);
  if (!period) {
    throw new AppError("Lock period not found", 404);
  }
  await period.deleteOne();
  await createAdminLog({
    adminId: admin._id,
    action: "Lock Period Deleted",
    entityType: "LockPeriod",
    entityId: id,
    oldValue: period.toObject(),
    severity: "danger",
  });
}

export async function handleEmergencyAction(admin, action, metadata = {}) {
  const settings = await getSettings();
  const previousValue = settings.toObject();

  switch (action) {
    case "pause_staking":
      settings.poolActive = false;
      break;
    case "resume_staking":
      settings.poolActive = true;
      break;
    case "freeze_claims":
      settings.claimsFrozen = true;
      break;
    case "freeze_withdrawals":
      settings.withdrawalsFrozen = true;
      break;
    case "maintenance_mode":
      settings.maintenanceMode = true;
      break;
    case "disable_pool":
      settings.poolActive = false;
      settings.maintenanceMode = true;
      break;
    default:
      throw new AppError("Unsupported emergency action", 400);
  }

  await settings.save();

  await createAdminLog({
    adminId: admin._id,
    action: `Emergency: ${action}`,
    entityType: "AdminSetting",
    entityId: settings._id.toString(),
    oldValue: previousValue,
    newValue: settings.toObject(),
    severity: "critical",
    meta: metadata,
  });

  return settings;
}

export async function listActivityLogs(query) {
  const filter = query
    ? {
        $or: [
          { action: { $regex: query, $options: "i" } },
          { entityType: { $regex: query, $options: "i" } },
        ],
      }
    : {};

  return import("../models/AdminLog.js").then(({ AdminLog }) =>
    AdminLog.find(filter)
      .populate("adminId", "name email")
      .sort({ createdAt: -1 })
      .limit(50),
  );
}

export async function createManualAdminLog(admin, payload) {
  return createAdminLog({
    adminId: admin._id,
    adminUserId: admin._id,
    adminWallet: admin.walletAddress,
    action: payload.action,
    module: payload.module || "admin",
    entityType: payload.entityType || "AdminAction",
    entityId: payload.entityId,
    oldValue: payload.oldValue,
    newValue: payload.newValue,
    txSignature: payload.txSignature,
    notes: payload.notes,
    severity: payload.severity || "info",
    meta: payload.meta,
  });
}

export async function getSystemHealth() {
  const [stakes, users, transactions, markets, settings] = await Promise.all([
    Stake.find({ status: "active" }),
    User.countDocuments(),
    Transaction.find({ type: "Rewards Claim" }),
    LendingMarket.find(),
    getSettings(),
  ]);

  const totalLockedLiquidity = stakes.reduce((sum, stake) => sum + stake.amount, 0);
  const pendingClaims = stakes.reduce((sum, stake) => sum + calculatePendingStakeReward(stake), 0);
  const totalRewardsDistributed = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const utilization =
    markets.length > 0 ? markets.reduce((sum, market) => sum + market.utilization, 0) / markets.length : 0;

  const warnings = [
    settings.maintenanceMode ? "Maintenance mode is enabled" : null,
    settings.claimsFrozen ? "Claims are frozen" : null,
    settings.withdrawalsFrozen ? "Withdrawals are frozen" : null,
    utilization > 82 ? "Lending utilization is elevated" : null,
  ].filter(Boolean);

  return {
    totalLockedLiquidity,
    activeUsers: users,
    pendingClaims,
    totalRewardsDistributed,
    utilization: Number(utilization.toFixed(2)),
    warnings,
  };
}

export async function getAdminUsers() {
  const users = await User.find().lean();
  const stakes = await Stake.find().lean();

  return users
    .map((user) => {
      const userStakes = stakes.filter((stake) => stake.userId.toString() === user._id.toString());
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        totalStaked: userStakes.reduce((sum, stake) => sum + stake.amount, 0),
        rewardEarned: userStakes.reduce((sum, stake) => sum + stake.rewardEarned, 0),
        status: user.role === "admin" ? "admin" : "active",
      };
    })
    .sort((a, b) => b.totalStaked - a.totalStaked)
    .slice(0, 10);
}

export async function getAdminOverview() {
  const [users, mirrors, logs, health, latestJobs, rpcLatency, networkOverview] = await Promise.all([
    User.find().lean(),
    TransactionMirror.countDocuments(),
    listActivityLogs(),
    ProtocolHealthSnapshot.findOne().sort({ createdAt: -1 }).lean(),
    JobRunLog.find().sort({ createdAt: -1 }).limit(5).lean(),
    getRpcLatency().catch(() => null),
    getNetworkOverview("24H").catch(() => null),
  ]);

  return {
    totalUsers: users.length,
    linkedWalletsCount: users.reduce((sum, user) => sum + (user.linkedWallets?.length || 0), 0),
    totalMirroredTransactions: mirrors,
    suspiciousActivityPlaceholder: users.filter((user) => (user.linkedWallets?.length || 0) > 3).length,
    protocolUsageStats: {
      adminUsers: users.filter((user) => user.role === "admin").length,
      primaryWalletCoverage: users.filter((user) => user.walletAddress).length,
    },
    latestAdminActions: logs.slice(0, 8),
    marketSyncHealth: latestJobs.find((job) => job.jobName === "sync-market-prices") || null,
    rpcSyncHealth: {
      rpcLatency,
      status: rpcLatency !== null && rpcLatency < 1200 ? "healthy" : "degraded",
    },
    networkMonitor: networkOverview
      ? {
          healthScore: networkOverview.health.score,
          healthLabel: networkOverview.health.label,
          lastUpdated: networkOverview.lastUpdated,
          tps: networkOverview.current.tps,
          blockTime: networkOverview.current.blockTime,
        }
      : null,
    jobRunStatus: latestJobs,
    protocolHealth: health,
  };
}

export async function getAdminJobRuns() {
  return JobRunLog.find().sort({ createdAt: -1 }).limit(25).lean();
}

export async function getProtocolHealthSummary() {
  const [latest, mirrors, networkOverview] = await Promise.all([
    ProtocolHealthSnapshot.findOne().sort({ createdAt: -1 }).lean(),
    TransactionMirror.countDocuments(),
    getNetworkOverview("24H").catch(() => null),
  ]);

  return {
    ...(latest || {
      stakingActive: true,
      liquidityActive: true,
      lendingActive: true,
      governanceActive: true,
      rpcLatency: 0,
      syncStatus: "unknown",
      lastIndexerRun: null,
      totalProtocolTx: 0,
      createdAt: null,
    }),
    mirroredTransactions: mirrors,
    networkMonitor: networkOverview
      ? {
          healthScore: networkOverview.health.score,
          healthLabel: networkOverview.health.label,
          rpcLatency: networkOverview.current.rpcLatency,
          tps: networkOverview.current.tps,
          blockTime: networkOverview.current.blockTime,
          lastUpdated: networkOverview.lastUpdated,
        }
      : null,
    source: "cache",
  };
}
