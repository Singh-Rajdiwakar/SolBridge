import { GovernanceMetadata } from "../models/GovernanceMetadata.js";
import { LendingPosition } from "../models/LendingPosition.js";
import { LiquidityPosition } from "../models/LiquidityPosition.js";
import { MarketPriceSnapshot } from "../models/MarketPriceSnapshot.js";
import { Pool } from "../models/Pool.js";
import { PortfolioSnapshot } from "../models/PortfolioSnapshot.js";
import { Proposal } from "../models/Proposal.js";
import { ProtocolHealthSnapshot } from "../models/ProtocolHealthSnapshot.js";
import { Stake } from "../models/Stake.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { User } from "../models/User.js";
import { Vote } from "../models/Vote.js";
import { findUserByWalletAddress } from "./user.service.js";

function percentage(part, total) {
  return total ? Number(((part / total) * 100).toFixed(2)) : 0;
}

export async function getWalletAnalytics(walletAddress) {
  const [user, transactions, snapshots] = await Promise.all([
    findUserByWalletAddress(walletAddress),
    TransactionMirror.find({ walletAddress }).sort({ blockTime: -1, createdAt: -1 }).lean(),
    PortfolioSnapshot.find({ walletAddress }).sort({ takenAt: -1 }).limit(12).lean(),
  ]);

  const totalSent = transactions
    .filter((transaction) => transaction.type.toLowerCase().includes("send"))
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const totalReceived = transactions
    .filter((transaction) => transaction.type.toLowerCase().includes("receive") || transaction.type.toLowerCase().includes("airdrop"))
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const tokenCounts = transactions.reduce((acc, transaction) => {
    const token = transaction.tokenSymbol || "SOL";
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});
  const favoriteToken =
    Object.entries(tokenCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "SOL";

  return {
    walletAddress,
    userId: user._id,
    txCount: transactions.length,
    totalSent: Number(totalSent.toFixed(4)),
    totalReceived: Number(totalReceived.toFixed(4)),
    averageTxSize: transactions.length
      ? Number(
          (
            transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) / transactions.length
          ).toFixed(4),
        )
      : 0,
    mostUsedToken: favoriteToken,
    walletAgeDays: Math.max(1, Math.round((Date.now() - new Date(user.createdAt).getTime()) / 86400000)),
    series: snapshots
      .slice()
      .reverse()
      .map((snapshot) => ({
        label: snapshot.takenAt.toISOString().slice(5, 10),
        value: snapshot.totalValue,
      })),
    source: "mirror+cache",
  };
}

export async function getStakingAnalytics(walletAddress) {
  const user = await findUserByWalletAddress(walletAddress);
  const stakes = await Stake.find({ userId: user._id }).lean();
  const activePositions = stakes.filter((stake) => stake.status === "active");

  return {
    walletAddress,
    totalStaked: Number(activePositions.reduce((sum, stake) => sum + stake.amount, 0).toFixed(4)),
    activePositions: activePositions.length,
    rewardsClaimed: Number(stakes.reduce((sum, stake) => sum + (stake.claimedReward || 0), 0).toFixed(4)),
    averageLockDuration: stakes.length
      ? Number((stakes.reduce((sum, stake) => sum + stake.durationDays, 0) / stakes.length).toFixed(2))
      : 0,
    source: "mirror",
  };
}

export async function getLiquidityAnalytics(walletAddress) {
  const user = await findUserByWalletAddress(walletAddress);
  const positions = await LiquidityPosition.find({ userId: user._id }).lean();
  const poolIds = positions.map((position) => position.poolId);
  const pools = await Pool.find({ _id: { $in: poolIds } }).lean();

  return {
    walletAddress,
    liquidityAdded: Number(positions.reduce((sum, position) => sum + position.amountA + position.amountB, 0).toFixed(4)),
    liquidityRemoved: 0,
    poolParticipation: positions.length,
    swapVolumeMirrored: Number(
      pools.reduce((sum, pool) => sum + (pool.volume24h || 0) * 0.01, 0).toFixed(2),
    ),
    source: "mirror",
  };
}

export async function getLendingAnalytics(walletAddress) {
  const user = await findUserByWalletAddress(walletAddress);
  const position = await LendingPosition.findOne({ userId: user._id }).lean();

  return {
    walletAddress,
    totalBorrowed: Number((position?.borrowValue || 0).toFixed(4)),
    averageCollateralRatio:
      position?.borrowValue && position?.collateralValue
        ? Number(((position.collateralValue / position.borrowValue) * 100).toFixed(2))
        : 0,
    repayments: 0,
    riskyPositionsCount: position && position.healthFactor < 1.5 ? 1 : 0,
    source: "mirror",
  };
}

export async function getGovernanceAnalytics(walletAddress) {
  const user = await findUserByWalletAddress(walletAddress);
  const [votes, proposals, metadataCount] = await Promise.all([
    Vote.find({ userId: user._id }).lean(),
    Proposal.find().lean(),
    GovernanceMetadata.countDocuments(),
  ]);

  const votedProposalIds = new Set(votes.map((vote) => String(vote.proposalId)));
  const turnout = percentage(votedProposalIds.size, proposals.length || 1);

  return {
    walletAddress,
    proposalCount: proposals.length,
    voterTurnout: turnout,
    quorumHitRate: percentage(
      proposals.filter((proposal) => proposal.votesYes + proposal.votesNo + proposal.votesAbstain >= proposal.quorum)
        .length,
      proposals.length || 1,
    ),
    userVoteParticipation: votes.length,
    metadataCoverage: metadataCount,
    source: "mirror+metadata",
  };
}

export async function getProtocolAnalytics() {
  const [users, stakes, liquidity, lending, proposals, mirrors, health] = await Promise.all([
    User.countDocuments(),
    Stake.find().lean(),
    LiquidityPosition.find().lean(),
    LendingPosition.find().lean(),
    Proposal.find().lean(),
    TransactionMirror.countDocuments(),
    ProtocolHealthSnapshot.findOne().sort({ createdAt: -1 }).lean(),
  ]);

  return {
    users,
    totalStaked: Number(stakes.reduce((sum, stake) => sum + stake.amount, 0).toFixed(4)),
    activeStakePositions: stakes.filter((stake) => stake.status === "active").length,
    liquidityProviders: liquidity.length,
    totalBorrowed: Number(lending.reduce((sum, position) => sum + (position.borrowValue || 0), 0).toFixed(4)),
    proposalCount: proposals.length,
    mirroredTransactions: mirrors,
    systemHealth: health,
    source: "mirror+cache",
  };
}

export async function getLatestMarketSnapshots(symbols = ["BTC", "ETH", "SOL"]) {
  const snapshots = await Promise.all(
    symbols.map((symbol) => MarketPriceSnapshot.findOne({ symbol }).sort({ fetchedAt: -1 }).lean()),
  );
  return snapshots.filter(Boolean);
}
