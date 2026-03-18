import { NFT } from "../models/NFT.js";
import { PortfolioSnapshot } from "../models/PortfolioSnapshot.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { TrackedWalletGroup } from "../models/TrackedWalletGroup.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import {
  getGovernanceAnalytics,
  getLendingAnalytics,
  getLiquidityAnalytics,
  getStakingAnalytics,
  getWalletAnalytics,
} from "./analytics.service.js";

const STABLECOINS = new Set(["USDC", "USDT", "DAI", "USDS", "PYUSD"]);
const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function toWalletLabel(address, label) {
  return label || `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function riskLabel(score) {
  if (score >= 90) return "Very Safe";
  if (score >= 70) return "Safe";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "High Risk";
  return "Critical Risk";
}

function diversityLabel(score) {
  if (score >= 75) return "High Diversification";
  if (score >= 45) return "Medium Diversification";
  return "Low Diversification";
}

function dedupeWalletEntries(wallets = []) {
  const entries = new Map();

  wallets.forEach((wallet, index) => {
    if (!wallet.address) {
      return;
    }

    if (!entries.has(wallet.address)) {
      entries.set(wallet.address, {
        address: wallet.address,
        label: wallet.label || "",
        type: wallet.type || "personal",
        notes: wallet.notes || "",
        isFavorite: Boolean(wallet.isFavorite),
        isPrimary: Boolean(wallet.isPrimary),
        addedAt: wallet.addedAt || new Date(),
        __index: index,
      });
      return;
    }

    const existing = entries.get(wallet.address);
    entries.set(wallet.address, {
      ...existing,
      label: existing.label || wallet.label || "",
      notes: existing.notes || wallet.notes || "",
      type: existing.type || wallet.type || "personal",
      isFavorite: existing.isFavorite || Boolean(wallet.isFavorite),
      isPrimary: existing.isPrimary || Boolean(wallet.isPrimary),
    });
  });

  const normalized = Array.from(entries.values())
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.__index - b.__index;
    })
    .map(({ __index, ...wallet }) => wallet);

  if (normalized.length > 0 && !normalized.some((wallet) => wallet.isPrimary)) {
    normalized[0].isPrimary = true;
  }

  return normalized;
}

function buildFallbackWalletAnalytics(walletAddress, transactions, snapshots, user) {
  const totalSent = transactions
    .filter((transaction) => transaction.type.toLowerCase().includes("send"))
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const totalReceived = transactions
    .filter((transaction) => {
      const normalized = transaction.type.toLowerCase();
      return normalized.includes("receive") || normalized.includes("airdrop");
    })
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const tokenCounts = transactions.reduce((acc, transaction) => {
    const symbol = transaction.tokenSymbol || "SOL";
    acc[symbol] = (acc[symbol] || 0) + 1;
    return acc;
  }, {});

  return {
    walletAddress,
    userId: user?._id,
    txCount: transactions.length,
    totalSent: round(totalSent, 4),
    totalReceived: round(totalReceived, 4),
    averageTxSize: transactions.length
      ? round(transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) / transactions.length, 4)
      : 0,
    mostUsedToken: Object.entries(tokenCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "SOL",
    walletAgeDays: Math.max(1, Math.round((Date.now() - new Date(user?.createdAt || Date.now()).getTime()) / DAY_MS)),
    series: snapshots
      .slice()
      .reverse()
      .map((snapshot) => ({
        label: new Date(snapshot.takenAt).toISOString().slice(5, 10),
        value: snapshot.totalValue,
      })),
    source: user ? "mirror+cache" : "mirror",
  };
}

function aggregateTokens(wallets) {
  const tokenMap = new Map();

  wallets.forEach((wallet) => {
    wallet.tokenBreakdown.forEach((token) => {
      const current = tokenMap.get(token.symbol) || {
        symbol: token.symbol,
        amount: 0,
        value: 0,
        wallets: 0,
      };

      tokenMap.set(token.symbol, {
        ...current,
        amount: current.amount + (token.amount || 0),
        value: current.value + (token.value || 0),
        wallets: current.wallets + 1,
      });
    });
  });

  const totalValue = Array.from(tokenMap.values()).reduce((sum, token) => sum + token.value, 0);

  return Array.from(tokenMap.values())
    .map((token) => ({
      ...token,
      allocationPercent: totalValue ? round((token.value / totalValue) * 100, 2) : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function buildTrendSeries(wallets) {
  const trendMap = new Map();

  wallets.forEach((wallet) => {
    wallet.snapshots
      .slice()
      .reverse()
      .forEach((snapshot) => {
        const label = new Date(snapshot.takenAt).toISOString().slice(0, 10);
        const point = trendMap.get(label) || { label, value: 0 };
        point.value += snapshot.totalValue || 0;
        trendMap.set(label, point);
      });
  });

  return Array.from(trendMap.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((point) => ({
      ...point,
      shortLabel: new Date(point.label).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
}

function calculateWalletRisk(wallet) {
  const totalValue = Math.max(wallet.currentValue, 1);
  const topAssetRatio = (wallet.tokenBreakdown[0]?.value || 0) / totalValue;
  const stablecoinRatio = wallet.tokenBreakdown
    .filter((token) => STABLECOINS.has(token.symbol))
    .reduce((sum, token) => sum + token.value, 0) / totalValue;
  const borrowRatio = clamp(wallet.exposures.lending / totalValue, 0, 1);
  const liquidityRatio = clamp(wallet.exposures.liquidity / totalValue, 0, 1);
  const failedRatio = wallet.txCount ? wallet.failedTransactions / wallet.txCount : 0;

  const penalty =
    topAssetRatio * 34 +
    Math.max(0, 0.12 - stablecoinRatio) * 42 +
    borrowRatio * 24 +
    liquidityRatio * 12 +
    failedRatio * 20 +
    Math.min(wallet.largeMovements * 4, 16) +
    (wallet.exposures.lendingRisky ? 18 : 0);

  const score = clamp(Math.round(100 - penalty), 4, 98);
  return {
    score,
    label: riskLabel(score),
    drivers: {
      topAssetRatio: round(topAssetRatio * 100, 2),
      stablecoinRatio: round(stablecoinRatio * 100, 2),
      borrowRatio: round(borrowRatio * 100, 2),
      liquidityRatio: round(liquidityRatio * 100, 2),
      failedRatio: round(failedRatio * 100, 2),
    },
  };
}

function calculateWalletDiversity(wallet) {
  const totalValue = Math.max(wallet.currentValue, 1);
  const uniqueTokens = wallet.tokenBreakdown.length;
  const topAssetRatio = (wallet.tokenBreakdown[0]?.value || 0) / totalValue;
  const stablecoinRatio = wallet.tokenBreakdown
    .filter((token) => STABLECOINS.has(token.symbol))
    .reduce((sum, token) => sum + token.value, 0) / totalValue;
  const exposureBuckets = [
    wallet.exposures.staking,
    wallet.exposures.liquidity,
    wallet.exposures.lending,
    wallet.exposures.governance,
    wallet.exposures.spot,
  ].filter((value) => value > 0).length;

  const score = clamp(
    Math.round(18 + Math.min(uniqueTokens * 11, 34) + Math.min(stablecoinRatio * 42, 18) + exposureBuckets * 7 - topAssetRatio * 32),
    6,
    96,
  );

  return {
    score,
    label: diversityLabel(score),
    explanation:
      topAssetRatio > 0.58
        ? `Portfolio is heavily concentrated in ${wallet.tokenBreakdown[0]?.symbol || "one asset"}.`
        : stablecoinRatio < 0.1
          ? "Stablecoin coverage is low relative to the tracked wallet value."
          : "Wallet mix is well distributed across assets and protocol exposure.",
  };
}

function buildHeatmapRows(wallets) {
  const today = new Date();
  return wallets.map((wallet) => {
    const cells = [];
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      const count = wallet.transactions.filter((transaction) => {
        const timestamp = transaction.blockTime || transaction.createdAt;
        return new Date(timestamp).toISOString().slice(0, 10) === key;
      }).length;
      cells.push({
        key,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        count,
      });
    }
    return {
      walletAddress: wallet.walletAddress,
      walletLabel: wallet.label,
      cells,
    };
  });
}

function buildTimeline(wallets) {
  return wallets
    .flatMap((wallet) =>
      wallet.transactions.slice(0, 8).map((transaction) => ({
        walletAddress: wallet.walletAddress,
        walletLabel: wallet.label,
        signature: transaction.signature,
        type: transaction.type,
        protocolModule: transaction.protocolModule,
        amount: transaction.amount || 0,
        tokenSymbol: transaction.tokenSymbol || "SOL",
        status: transaction.status,
        explorerUrl: transaction.explorerUrl,
        createdAt: transaction.blockTime || transaction.createdAt,
      })),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 24);
}

function buildWhaleSignals(wallets) {
  const averageValue = wallets.length > 0
    ? wallets.reduce((sum, wallet) => sum + wallet.currentValue, 0) / wallets.length
    : 0;
  const topBalanceWallet = wallets.slice().sort((a, b) => b.currentValue - a.currentValue)[0] || null;
  const topVolumeWallet = wallets.slice().sort((a, b) => b.transactionVolume - a.transactionVolume)[0] || null;
  const topTransaction = wallets
    .flatMap((wallet) =>
      wallet.transactions.map((transaction) => ({
        walletLabel: wallet.label,
        walletAddress: wallet.walletAddress,
        amount: transaction.amount || 0,
        tokenSymbol: transaction.tokenSymbol || "SOL",
        signature: transaction.signature,
        explorerUrl: transaction.explorerUrl,
        createdAt: transaction.blockTime || transaction.createdAt,
        type: transaction.type,
      })),
    )
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0] || null;

  const flags = [];
  wallets.forEach((wallet) => {
    if (wallet.currentValue > averageValue * 1.6 && wallet.currentValue > 1000) {
      flags.push({
        walletAddress: wallet.walletAddress,
        walletLabel: wallet.label,
        severity: "watch",
        title: "Whale balance concentration",
        description: `${wallet.label} holds significantly more value than the average tracked wallet.`,
      });
    }
    if (wallet.largeMovements > 0) {
      flags.push({
        walletAddress: wallet.walletAddress,
        walletLabel: wallet.label,
        severity: "signal",
        title: "Large transfer activity",
        description: `${wallet.largeMovements} unusually large mirrored transactions detected recently.`,
      });
    }
    if (Math.abs(wallet.change24h) > 18 && wallet.currentValue > 1000) {
      flags.push({
        walletAddress: wallet.walletAddress,
        walletLabel: wallet.label,
        severity: wallet.change24h > 0 ? "watch" : "warning",
        title: "High 24h wallet movement",
        description: `${wallet.label} moved ${round(wallet.change24h, 2)}% in the latest snapshot window.`,
      });
    }
  });

  return {
    topBalanceWallet: topBalanceWallet
      ? { walletLabel: topBalanceWallet.label, walletAddress: topBalanceWallet.walletAddress, totalValue: topBalanceWallet.currentValue }
      : null,
    topVolumeWallet: topVolumeWallet
      ? { walletLabel: topVolumeWallet.label, walletAddress: topVolumeWallet.walletAddress, volume: topVolumeWallet.transactionVolume }
      : null,
    topTransaction,
    flags,
  };
}

function buildRecommendations(wallets, aggregateRisk, aggregateDiversity) {
  const recommendations = [];
  const highestRisk = wallets.slice().sort((a, b) => a.risk.score - b.risk.score)[0];
  const concentrated = wallets
    .filter((wallet) => wallet.tokenBreakdown.length > 0)
    .sort((a, b) => (b.tokenBreakdown[0]?.value || 0) / Math.max(b.currentValue, 1) - (a.tokenBreakdown[0]?.value || 0) / Math.max(a.currentValue, 1))[0];

  if (highestRisk && highestRisk.risk.score < 55) {
    recommendations.push(`Reduce concentrated or borrowed exposure in ${highestRisk.label}; it currently has the weakest safety score in the group.`);
  }
  if (concentrated && (concentrated.tokenBreakdown[0]?.value || 0) / Math.max(concentrated.currentValue, 1) > 0.6) {
    recommendations.push(`Diversify ${concentrated.label}; one token dominates more than 60% of wallet value.`);
  }
  if (aggregateDiversity.score < 45) {
    recommendations.push("Group-level diversification is low. Spread value across stable assets and protocol categories.");
  }
  if (aggregateRisk.score < 60) {
    recommendations.push("Aggregate wallet risk is elevated. Review LP and lending exposure before increasing position size.");
  }

  return recommendations.length > 0
    ? recommendations
    : ["Cross-wallet allocation looks balanced. Continue monitoring mirrored activity and large transfer spikes."];
}

function toCsv(payload) {
  const lines = [
    ["section", "label", "value"].join(","),
    ["summary", "groupName", payload.summary.group.name].join(","),
    ["summary", "walletsTracked", payload.summary.walletsTracked].join(","),
    ["summary", "aggregatedValue", payload.summary.aggregatedValue].join(","),
    ["summary", "totalPnl", payload.pnl.totalPnl].join(","),
    ["summary", "averageRiskScore", payload.risk.aggregate.score].join(","),
    ["summary", "diversityScore", payload.diversity.aggregate.score].join(","),
    ...payload.summary.wallets.map((wallet) => ["wallet", wallet.label, `${wallet.currentValue}|${wallet.pnl}|${wallet.risk.score}|${wallet.diversity.score}`].join(",")),
    ...payload.whale.flags.map((flag) => ["whale", flag.walletLabel, `"${flag.title} - ${flag.description}"`].join(",")),
  ];

  return lines.join("\n");
}

async function ensureDefaultGroup(userId) {
  const existing = await TrackedWalletGroup.findOne({ userId }).sort({ createdAt: 1 });
  if (existing) {
    return existing;
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const wallets = dedupeWalletEntries([
    { address: user.walletAddress, label: "Primary Wallet", type: "personal", isPrimary: true, isFavorite: true },
    ...(user.linkedWallets || []).map((wallet) => ({
      address: wallet.address,
      label: wallet.label || "",
      type: wallet.favorite ? "watch-only" : "personal",
      notes: wallet.notes || "",
      isFavorite: Boolean(wallet.favorite),
      isPrimary: Boolean(wallet.isPrimary),
      addedAt: wallet.addedAt,
    })),
  ]);

  return TrackedWalletGroup.create({
    userId,
    name: "Primary Intelligence Set",
    wallets,
  });
}

async function getGroupForUser(userId, groupId) {
  await ensureDefaultGroup(userId);
  const group = await TrackedWalletGroup.findOne({ _id: groupId, userId });
  if (!group) {
    throw new AppError("Tracked wallet group not found", 404);
  }
  return group;
}

async function buildWalletSummary(walletEntry) {
  const walletAddress = walletEntry.address;
  const matchedUser = await User.findOne({
    $or: [{ walletAddress }, { "linkedWallets.address": walletAddress }],
  }).lean();

  const [snapshots, transactions, txCount, nftCount] = await Promise.all([
    PortfolioSnapshot.find({ walletAddress }).sort({ takenAt: -1 }).limit(14).lean(),
    TransactionMirror.find({ walletAddress }).sort({ blockTime: -1, createdAt: -1 }).limit(48).lean(),
    TransactionMirror.countDocuments({ walletAddress }),
    NFT.countDocuments({ owner: walletAddress }),
  ]);

  const [walletAnalytics, stakingAnalytics, liquidityAnalytics, lendingAnalytics, governanceAnalytics] = matchedUser
    ? await Promise.all([
        getWalletAnalytics(walletAddress).catch(() => buildFallbackWalletAnalytics(walletAddress, transactions, snapshots, matchedUser)),
        getStakingAnalytics(walletAddress).catch(() => ({ totalStaked: 0, activePositions: 0, rewardsClaimed: 0, averageLockDuration: 0, source: "fallback" })),
        getLiquidityAnalytics(walletAddress).catch(() => ({ liquidityAdded: 0, liquidityRemoved: 0, poolParticipation: 0, swapVolumeMirrored: 0, source: "fallback" })),
        getLendingAnalytics(walletAddress).catch(() => ({ totalBorrowed: 0, averageCollateralRatio: 0, repayments: 0, riskyPositionsCount: 0, source: "fallback" })),
        getGovernanceAnalytics(walletAddress).catch(() => ({ proposalCount: 0, voterTurnout: 0, quorumHitRate: 0, userVoteParticipation: 0, metadataCoverage: 0, source: "fallback" })),
      ])
    : [
        buildFallbackWalletAnalytics(walletAddress, transactions, snapshots, matchedUser),
        { totalStaked: 0, activePositions: 0, rewardsClaimed: 0, averageLockDuration: 0, source: "mirror" },
        { liquidityAdded: 0, liquidityRemoved: 0, poolParticipation: 0, swapVolumeMirrored: 0, source: "mirror" },
        { totalBorrowed: 0, averageCollateralRatio: 0, repayments: 0, riskyPositionsCount: 0, source: "mirror" },
        { proposalCount: 0, voterTurnout: 0, quorumHitRate: 0, userVoteParticipation: 0, metadataCoverage: 0, source: "mirror" },
      ];

  const latestSnapshot = snapshots[0] || null;
  const previousSnapshot = snapshots[1] || null;
  const tokenBreakdown = latestSnapshot?.tokenBreakdown || [];
  const currentValue = latestSnapshot?.totalValue || tokenBreakdown.reduce((sum, token) => sum + (token.value || 0), 0);
  const totalInvested = latestSnapshot?.totalInvested || Math.max(0, currentValue - (latestSnapshot?.pnl || 0));
  const pnl = latestSnapshot?.pnl ?? currentValue - totalInvested;
  const change24h = previousSnapshot?.totalValue ? round(((currentValue - previousSnapshot.totalValue) / previousSnapshot.totalValue) * 100, 2) : 0;
  const failedTransactions = transactions.filter((transaction) => transaction.status === "failed").length;
  const transactionVolume = round(transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount || 0), 0), 4);
  const averageTxVolume = transactions.length ? transactionVolume / transactions.length : 0;
  const largeMovements = transactions.filter((transaction) => {
    const baseline = Math.max(averageTxVolume * 3.5, currentValue * 0.12, 25);
    return Math.abs(transaction.amount || 0) >= baseline;
  }).length;

  const exposures = {
    staking: round(stakingAnalytics.totalStaked || 0, 4),
    liquidity: round(liquidityAnalytics.liquidityAdded || 0, 4),
    lending: round(lendingAnalytics.totalBorrowed || 0, 4),
    governance: governanceAnalytics.userVoteParticipation || 0,
    spot: round(Math.max(0, currentValue - (stakingAnalytics.totalStaked || 0) - (liquidityAnalytics.liquidityAdded || 0)), 4),
    lendingRisky: (lendingAnalytics.riskyPositionsCount || 0) > 0,
  };

  const summary = {
    walletAddress,
    label: toWalletLabel(walletAddress, walletEntry.label),
    type: walletEntry.type || "personal",
    notes: walletEntry.notes || "",
    isFavorite: Boolean(walletEntry.isFavorite),
    isPrimary: Boolean(walletEntry.isPrimary),
    currentValue: round(currentValue, 2),
    totalInvested: round(totalInvested, 2),
    pnl: round(pnl, 2),
    change24h,
    tokenCount: tokenBreakdown.length,
    txCount,
    recentActivity: transactions[0]?.blockTime || transactions[0]?.createdAt || null,
    nftCount,
    transactionVolume,
    failedTransactions,
    largeMovements,
    exposures,
    walletAnalytics,
    stakingAnalytics,
    liquidityAnalytics,
    lendingAnalytics,
    governanceAnalytics,
    tokenBreakdown,
    snapshots,
    transactions,
  };

  summary.risk = calculateWalletRisk(summary);
  summary.diversity = calculateWalletDiversity(summary);
  return summary;
}

async function buildDataset(userId, groupId) {
  const group = await getGroupForUser(userId, groupId);
  const wallets = await Promise.all(group.wallets.map((wallet) => buildWalletSummary(wallet)));
  const combinedTokens = aggregateTokens(wallets);
  const aggregateValue = wallets.reduce((sum, wallet) => sum + wallet.currentValue, 0);
  const totalInvested = wallets.reduce((sum, wallet) => sum + wallet.totalInvested, 0);
  const totalPnl = wallets.reduce((sum, wallet) => sum + wallet.pnl, 0);
  const combinedExposures = {
    staking: round(wallets.reduce((sum, wallet) => sum + wallet.exposures.staking, 0), 4),
    liquidity: round(wallets.reduce((sum, wallet) => sum + wallet.exposures.liquidity, 0), 4),
    lending: round(wallets.reduce((sum, wallet) => sum + wallet.exposures.lending, 0), 4),
    governance: wallets.reduce((sum, wallet) => sum + wallet.exposures.governance, 0),
    spot: round(wallets.reduce((sum, wallet) => sum + wallet.exposures.spot, 0), 4),
  };

  const aggregateProxy = {
    currentValue: aggregateValue,
    tokenBreakdown: combinedTokens,
    exposures: {
      ...combinedExposures,
      lendingRisky: wallets.some((wallet) => wallet.exposures.lendingRisky),
    },
    txCount: wallets.reduce((sum, wallet) => sum + wallet.txCount, 0),
    failedTransactions: wallets.reduce((sum, wallet) => sum + wallet.failedTransactions, 0),
    largeMovements: wallets.reduce((sum, wallet) => sum + wallet.largeMovements, 0),
  };

  return {
    group: group.toObject(),
    wallets,
    combinedTokens,
    aggregateValue: round(aggregateValue, 2),
    totalInvested: round(totalInvested, 2),
    totalPnl: round(totalPnl, 2),
    combinedExposures,
    aggregateRisk: calculateWalletRisk(aggregateProxy),
    aggregateDiversity: calculateWalletDiversity(aggregateProxy),
    whaleSignals: buildWhaleSignals(wallets),
    trend: buildTrendSeries(wallets),
  };
}

export async function listTrackedWalletGroups(userId) {
  await ensureDefaultGroup(userId);
  return TrackedWalletGroup.find({ userId }).sort({ createdAt: 1 }).lean();
}

export async function createTrackedWalletGroup(userId, payload) {
  return TrackedWalletGroup.create({
    userId,
    name: payload.name,
    wallets: dedupeWalletEntries(payload.wallets || []),
  });
}

export async function updateTrackedWalletGroup(userId, groupId, payload) {
  const group = await getGroupForUser(userId, groupId);
  if (payload.name !== undefined) {
    group.name = payload.name;
  }
  if (payload.wallets !== undefined) {
    group.wallets = dedupeWalletEntries(payload.wallets);
  }
  await group.save();
  return group.toObject();
}

export async function deleteTrackedWalletGroup(userId, groupId) {
  const group = await getGroupForUser(userId, groupId);
  await group.deleteOne();
  return { id: groupId, deleted: true };
}

export async function getCrossWalletSummary(userId, groupId) {
  const dataset = await buildDataset(userId, groupId);
  const best = dataset.wallets.slice().sort((a, b) => b.pnl - a.pnl)[0] || null;
  const worst = dataset.wallets.slice().sort((a, b) => a.pnl - b.pnl)[0] || null;

  return {
    group: { id: dataset.group._id, name: dataset.group.name, wallets: dataset.group.wallets },
    walletsTracked: dataset.wallets.length,
    aggregatedValue: dataset.aggregateValue,
    totalInvested: dataset.totalInvested,
    totalPnl: dataset.totalPnl,
    averageRiskScore: round(dataset.aggregateRisk.score, 0),
    diversityIndex: round(dataset.aggregateDiversity.score, 0),
    whaleFlagCount: dataset.whaleSignals.flags.length,
    bestPerformer: best ? { walletLabel: best.label, walletAddress: best.walletAddress, pnl: best.pnl } : null,
    worstPerformer: worst ? { walletLabel: worst.label, walletAddress: worst.walletAddress, pnl: worst.pnl } : null,
    wallets: dataset.wallets.map((wallet) => ({
      walletAddress: wallet.walletAddress,
      label: wallet.label,
      type: wallet.type,
      notes: wallet.notes,
      isFavorite: wallet.isFavorite,
      isPrimary: wallet.isPrimary,
      currentValue: wallet.currentValue,
      change24h: wallet.change24h,
      pnl: wallet.pnl,
      tokenCount: wallet.tokenCount,
      txCount: wallet.txCount,
      recentActivity: wallet.recentActivity,
      risk: wallet.risk,
      diversity: wallet.diversity,
      exposures: wallet.exposures,
      nftCount: wallet.nftCount,
    })),
    source: "mirror+cache",
  };
}

export async function getCrossWalletPnl(userId, groupId) {
  const dataset = await buildDataset(userId, groupId);
  const best = dataset.wallets.slice().sort((a, b) => b.pnl - a.pnl)[0] || null;
  const worst = dataset.wallets.slice().sort((a, b) => a.pnl - b.pnl)[0] || null;

  return {
    totalInvested: dataset.totalInvested,
    totalCurrentValue: dataset.aggregateValue,
    totalPnl: dataset.totalPnl,
    unrealizedPnl: dataset.totalPnl,
    realizedPnl: 0,
    bestPerformingWallet: best ? { walletLabel: best.label, pnl: best.pnl } : null,
    worstPerformingWallet: worst ? { walletLabel: worst.label, pnl: worst.pnl } : null,
    trend: dataset.trend,
    pnlByWallet: dataset.wallets.map((wallet) => ({
      walletLabel: wallet.label,
      walletAddress: wallet.walletAddress,
      pnl: wallet.pnl,
      currentValue: wallet.currentValue,
      change24h: wallet.change24h,
    })),
    assetDistribution: dataset.combinedTokens.map((token) => ({
      name: token.symbol,
      value: round(token.value, 2),
      allocationPercent: token.allocationPercent,
    })),
    tokenPnl: dataset.combinedTokens.map((token) => ({
      symbol: token.symbol,
      value: round(token.value, 2),
      allocationPercent: token.allocationPercent,
      wallets: token.wallets,
    })),
    source: "mirror+cache",
  };
}

export async function getCrossWalletRisk(userId, groupId) {
  const dataset = await buildDataset(userId, groupId);
  return {
    aggregate: {
      score: dataset.aggregateRisk.score,
      label: dataset.aggregateRisk.label,
      recommendations: buildRecommendations(dataset.wallets, dataset.aggregateRisk, dataset.aggregateDiversity),
    },
    wallets: dataset.wallets.map((wallet) => ({
      walletLabel: wallet.label,
      walletAddress: wallet.walletAddress,
      score: wallet.risk.score,
      label: wallet.risk.label,
      drivers: wallet.risk.drivers,
    })),
    source: "mirror+cache",
  };
}

export async function getCrossWalletDiversity(userId, groupId) {
  const dataset = await buildDataset(userId, groupId);
  const totalValue = Math.max(dataset.aggregateValue, 1);
  const topToken = dataset.combinedTokens[0];
  const stablecoinRatio = dataset.combinedTokens
    .filter((token) => STABLECOINS.has(token.symbol))
    .reduce((sum, token) => sum + token.value, 0) / totalValue;

  return {
    aggregate: {
      score: dataset.aggregateDiversity.score,
      label: dataset.aggregateDiversity.label,
      explanation: dataset.aggregateDiversity.explanation,
      uniqueTokens: dataset.combinedTokens.length,
      stablecoinRatio: round(stablecoinRatio * 100, 2),
      topAssetRatio: round(((topToken?.value || 0) / totalValue) * 100, 2),
      activeExposureBuckets: Object.values(dataset.combinedExposures).filter((value) => value > 0).length,
    },
    wallets: dataset.wallets.map((wallet) => ({
      walletLabel: wallet.label,
      walletAddress: wallet.walletAddress,
      score: wallet.diversity.score,
      label: wallet.diversity.label,
      explanation: wallet.diversity.explanation,
    })),
    source: "mirror+cache",
  };
}

export async function getCrossWalletActivity(userId, groupId) {
  const dataset = await buildDataset(userId, groupId);
  return {
    timeline: buildTimeline(dataset.wallets),
    heatmap: buildHeatmapRows(dataset.wallets),
    activitySummary: dataset.wallets.map((wallet) => ({
      walletLabel: wallet.label,
      walletAddress: wallet.walletAddress,
      txCount: wallet.txCount,
      recentActivity: wallet.recentActivity,
      volume: wallet.transactionVolume,
      largeMovements: wallet.largeMovements,
    })),
    source: "mirror",
  };
}

export async function getCrossWalletWhaleSignals(userId, groupId) {
  const dataset = await buildDataset(userId, groupId);
  return {
    ...dataset.whaleSignals,
    source: "mirror+cache",
  };
}

export async function exportCrossWalletData(userId, groupId, format = "json") {
  const [summary, pnl, risk, diversity, activity, whale] = await Promise.all([
    getCrossWalletSummary(userId, groupId),
    getCrossWalletPnl(userId, groupId),
    getCrossWalletRisk(userId, groupId),
    getCrossWalletDiversity(userId, groupId),
    getCrossWalletActivity(userId, groupId),
    getCrossWalletWhaleSignals(userId, groupId),
  ]);

  const payload = {
    generatedAt: new Date().toISOString(),
    summary,
    pnl,
    risk,
    diversity,
    activity,
    whale,
  };

  if (format === "csv") {
    return {
      format,
      filename: `${summary.group.name.toLowerCase().replace(/\s+/g, "-")}-cross-wallet.csv`,
      content: toCsv(payload),
    };
  }

  return {
    format,
    filename: `${summary.group.name.toLowerCase().replace(/\s+/g, "-")}-cross-wallet.json`,
    content: JSON.stringify(payload, null, 2),
  };
}
