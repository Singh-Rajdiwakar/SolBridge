import { AdminLog } from "../models/AdminLog.js";
import { PortfolioSnapshot } from "../models/PortfolioSnapshot.js";
import { ProtocolHealthSnapshot } from "../models/ProtocolHealthSnapshot.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { User } from "../models/User.js";
import { getBalance, getRpcLatency } from "./solana.service.js";
import {
  getGovernanceAnalytics,
  getLatestMarketSnapshots,
  getLendingAnalytics,
  getLiquidityAnalytics,
  getProtocolAnalytics,
  getStakingAnalytics,
  getWalletAnalytics,
} from "./analytics.service.js";
import { findUserByWalletAddress } from "./user.service.js";

export async function getDashboardSummary(walletAddress) {
  const [user, onChainBalance, walletAnalytics, staking, liquidity, lending, governance, snapshots, recentTransactions] =
    await Promise.all([
      findUserByWalletAddress(walletAddress),
      getBalance(walletAddress),
      getWalletAnalytics(walletAddress),
      getStakingAnalytics(walletAddress),
      getLiquidityAnalytics(walletAddress),
      getLendingAnalytics(walletAddress),
      getGovernanceAnalytics(walletAddress),
      PortfolioSnapshot.find({ walletAddress }).sort({ takenAt: -1 }).limit(8).lean(),
      TransactionMirror.find({ walletAddress }).sort({ blockTime: -1, createdAt: -1 }).limit(8).lean(),
    ]);

  return {
    walletAddress,
    sourceOfTruth: "on-chain protocol state, mirrored analytics cache",
    walletSummary: {
      owner: user.name,
      onChainSolBalance: onChainBalance.sol,
      mirroredAnalytics: walletAnalytics,
      latestSnapshots: snapshots,
      source: "chain+cache",
    },
    stakingSummary: staking,
    liquiditySummary: liquidity,
    lendingSummary: lending,
    governanceSummary: governance,
    recentMirroredTransactions: recentTransactions,
  };
}

export async function getAdminSummary() {
  const [protocol, health, adminLogs, users, rpcLatency, marketSummary] = await Promise.all([
    getProtocolAnalytics(),
    ProtocolHealthSnapshot.findOne().sort({ createdAt: -1 }).lean(),
    AdminLog.find().sort({ createdAt: -1 }).limit(8).lean(),
    User.find({}, "email role linkedWallets").lean(),
    getRpcLatency().catch(() => null),
    getLatestMarketSnapshots(),
  ]);

  return {
    source: "mirror+cache",
    protocol,
    health,
    users: {
      totalUsers: users.length,
      linkedWalletsCount: users.reduce((sum, user) => sum + (user.linkedWallets?.length || 0), 0),
    },
    latestAdminActions: adminLogs,
    rpcLatency,
    marketSummary,
  };
}
