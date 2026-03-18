import { NFT } from "../models/NFT.js";
import { PortfolioSnapshot } from "../models/PortfolioSnapshot.js";
import { PublicWalletProfile } from "../models/PublicWalletProfile.js";
import { SharedPortfolioSnapshot } from "../models/SharedPortfolioSnapshot.js";
import { Stake } from "../models/Stake.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { User } from "../models/User.js";
import { Vote } from "../models/Vote.js";
import { WalletBadge } from "../models/WalletBadge.js";
import { WalletFollow } from "../models/WalletFollow.js";
import { WalletLeaderboardSnapshot } from "../models/WalletLeaderboardSnapshot.js";
import { LiquidityPosition } from "../models/LiquidityPosition.js";
import { LendingPosition } from "../models/LendingPosition.js";
import { AppError } from "../utils/app-error.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const STABLECOINS = new Set(["USDC", "USDT", "DAI", "USDS", "PYUSD"]);
const LEADERBOARD_LIMIT = 8;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function shortAddress(address = "") {
  return address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "--";
}

function labelFromScore(score) {
  if (score >= 82) return "Trusted";
  if (score >= 68) return "Active";
  if (score >= 52) return "Emerging";
  if (score >= 36) return "High Visibility";
  return "Monitored";
}

function visibilityAllows(profile, flag, isOwner) {
  if (isOwner) {
    return true;
  }
  if (!profile || profile.visibility === "private") {
    return false;
  }
  return profile.visibilitySettings?.[flag] !== false;
}

function dedupeTags(tags = []) {
  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

function isOwnedWallet(user, walletAddress) {
  if (!user) {
    return false;
  }

  if (user.walletAddress === walletAddress) {
    return true;
  }

  return (user.linkedWallets || []).some((wallet) => wallet.address === walletAddress);
}

function buildFallbackTokenBreakdown(user) {
  const balances = user?.balances || [];
  const total = balances.reduce((sum, balance) => sum + (balance.fiatValue || 0), 0);

  return balances
    .map((balance) => ({
      symbol: balance.token,
      amount: balance.amount || 0,
      value: balance.fiatValue || 0,
      allocationPercent: total ? round(((balance.fiatValue || 0) / total) * 100, 2) : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

async function findUserByWallet(walletAddress) {
  return User.findOne({
    $or: [{ walletAddress }, { "linkedWallets.address": walletAddress }],
  }).lean();
}

async function ensureOwnedProfile(userId, walletAddress) {
  const user = await User.findById(userId).lean();
  if (!user || !isOwnedWallet(user, walletAddress)) {
    throw new AppError("You can only manage public profiles for your own wallets", 403);
  }
  return user;
}

async function getOrCreatePublicProfile(user, walletAddress) {
  let profile = await PublicWalletProfile.findOne({ walletAddress });
  if (!profile) {
    profile = await PublicWalletProfile.create({
      userId: user._id,
      walletAddress,
      displayName: user.name,
      avatar: user.avatar || "",
      visibility: "private",
      isDiscoverable: false,
      showInLeaderboards: false,
      showInTrending: false,
      visibilitySettings: {
        showPortfolioValue: true,
        showTokenBalances: true,
        showPnl: true,
        showNfts: true,
        showActivityFeed: true,
        showBadges: true,
        showSnapshots: true,
        showExposure: true,
        showRisk: true,
      },
    });
  }
  return profile;
}

function computeDiversity(tokenBreakdown, exposures) {
  const totalValue = Math.max(tokenBreakdown.reduce((sum, token) => sum + (token.value || 0), 0), 1);
  const topAssetRatio = (tokenBreakdown[0]?.value || 0) / totalValue;
  const stableRatio =
    tokenBreakdown
      .filter((token) => STABLECOINS.has(token.symbol))
      .reduce((sum, token) => sum + (token.value || 0), 0) / totalValue;
  const activeExposureBuckets = [
    exposures.staking,
    exposures.liquidity,
    exposures.lending,
    exposures.governance,
    exposures.spot,
  ].filter((value) => value > 0).length;

  const score = clamp(
    Math.round(
      18 + Math.min(tokenBreakdown.length * 11, 34) + Math.min(stableRatio * 30, 16) + activeExposureBuckets * 7 - topAssetRatio * 28,
    ),
    8,
    96,
  );

  return {
    score,
    label: score >= 76 ? "Diversified" : score >= 48 ? "Balanced" : "Concentrated",
    explanation:
      topAssetRatio > 0.58
        ? `Portfolio remains highly concentrated in ${tokenBreakdown[0]?.symbol || "one asset"}.`
        : stableRatio < 0.08
          ? "Stable reserve is limited, which increases downside volatility."
          : "Exposure is distributed across multiple assets and DeFi activities.",
  };
}

function computeRisk(tokenBreakdown, exposures, txCount, followerCount, largeMovements, lendingHealth) {
  const totalValue = Math.max(tokenBreakdown.reduce((sum, token) => sum + (token.value || 0), 0), 1);
  const topAssetRatio = (tokenBreakdown[0]?.value || 0) / totalValue;
  const stableRatio =
    tokenBreakdown
      .filter((token) => STABLECOINS.has(token.symbol))
      .reduce((sum, token) => sum + (token.value || 0), 0) / totalValue;
  const borrowingRatio = clamp(exposures.lending / totalValue, 0, 1);
  const liquidityRatio = clamp(exposures.liquidity / totalValue, 0, 1);

  const riskPenalty =
    topAssetRatio * 30 +
    Math.max(0, 0.12 - stableRatio) * 36 +
    borrowingRatio * 20 +
    liquidityRatio * 14 +
    Math.min(largeMovements * 4, 14) +
    (lendingHealth > 0 && lendingHealth < 1.8 ? 18 : 0);

  const score = clamp(Math.round(100 - riskPenalty + Math.min(followerCount, 12) + Math.min(txCount / 8, 8)), 6, 98);

  return {
    score,
    label:
      score >= 78 ? "Very Safe" : score >= 60 ? "Safe" : score >= 42 ? "Moderate" : score >= 24 ? "High Risk" : "Critical",
    explanation:
      topAssetRatio > 0.6
        ? "One asset dominates portfolio value, which raises concentration risk."
        : borrowingRatio > 0.24
          ? "Borrow exposure is elevated relative to the visible portfolio base."
          : liquidityRatio > 0.35
            ? "Liquidity concentration increases pool and impermanent loss sensitivity."
            : "Risk posture remains balanced for the visible allocation mix.",
  };
}

function buildReputationScore({ walletAgeDays, txCount, governanceVotes, diversityScore, riskScore, suspiciousSignals }) {
  const score = clamp(
    Math.round(
      22 +
        Math.min(walletAgeDays / 12, 24) +
        Math.min(txCount / 3, 18) +
        Math.min(governanceVotes * 7, 16) +
        diversityScore * 0.18 +
        riskScore * 0.16 -
        suspiciousSignals * 12,
    ),
    12,
    98,
  );

  return {
    score,
    label: labelFromScore(score),
    summary:
      score >= 78
        ? "Consistent on-chain activity and diversified participation increase trust."
        : score >= 58
          ? "Healthy participation profile with moderate ecosystem visibility."
          : "Limited history or concentration signals keep reputation in an emerging range.",
  };
}

function buildActivityItem(walletAddress, displayName, transaction) {
  const normalizedType = String(transaction.type || "Activity").toLowerCase();
  const title =
    normalizedType.includes("stake")
      ? "Started staking"
      : normalizedType.includes("swap")
        ? "Executed swap"
        : normalizedType.includes("vote")
          ? "Recorded governance action"
          : normalizedType.includes("liquidity")
            ? "Adjusted liquidity"
            : normalizedType.includes("mint")
              ? "Minted token"
              : normalizedType.includes("borrow")
                ? "Adjusted lending position"
                : "Moved assets";

  return {
    id: transaction.signature || transaction._id?.toString() || `${walletAddress}-${transaction.createdAt}`,
    walletAddress,
    displayName,
    type: transaction.type,
    protocolModule: transaction.protocolModule,
    title,
    description: `${displayName} recorded a ${transaction.type.toLowerCase()} event involving ${transaction.tokenSymbol || transaction.token || "SOL"}.`,
    amount: transaction.amount || 0,
    tokenSymbol: transaction.tokenSymbol || transaction.token || "SOL",
    signature: transaction.signature,
    explorerUrl: transaction.explorerUrl,
    createdAt: transaction.blockTime || transaction.createdAt,
  };
}

function buildSnapshotShareItem(snapshot, displayName) {
  return {
    id: snapshot._id.toString(),
    walletAddress: snapshot.walletAddress,
    displayName,
    type: "Snapshot Share",
    protocolModule: "social",
    title: "Shared portfolio snapshot",
    description: `${displayName} published a portfolio snapshot for ${snapshot.timeframe}.`,
    amount: snapshot.summaryData?.portfolioValue || 0,
    tokenSymbol: "USD",
    createdAt: snapshot.createdAt,
  };
}

async function fetchWalletContext(walletAddress) {
  const user = await findUserByWallet(walletAddress);
  const userId = user?._id;

  const [latestSnapshots, transactions, stakes, liquidityPositions, lendingPosition, votes, nftCount, followerCount, followingCount] = await Promise.all([
    PortfolioSnapshot.find({ walletAddress }).sort({ takenAt: -1 }).limit(6).lean(),
    TransactionMirror.find({ walletAddress }).sort({ blockTime: -1, createdAt: -1 }).limit(24).lean(),
    userId ? Stake.find({ userId, status: "active" }).lean() : [],
    userId ? LiquidityPosition.find({ userId }).lean() : [],
    userId ? LendingPosition.findOne({ userId }).lean() : null,
    userId ? Vote.find({ userId }).lean() : [],
    NFT.countDocuments({ owner: walletAddress }),
    WalletFollow.countDocuments({ followedWalletAddress: walletAddress }),
    userId ? WalletFollow.countDocuments({ followerUserId: userId }) : 0,
  ]);

  const latestSnapshot = latestSnapshots[0] || null;
  const previousSnapshot = latestSnapshots[1] || null;
  const tokenBreakdown = latestSnapshot?.tokenBreakdown?.length
    ? latestSnapshot.tokenBreakdown
    : buildFallbackTokenBreakdown(user);

  const currentValue = latestSnapshot?.totalValue || tokenBreakdown.reduce((sum, token) => sum + (token.value || 0), 0);
  const previousValue = previousSnapshot?.totalValue || currentValue;
  const change24h = previousValue ? round(((currentValue - previousValue) / previousValue) * 100, 2) : 0;
  const exposures = {
    staking: stakes.reduce((sum, stake) => sum + (stake.amount || 0), 0),
    liquidity: liquidityPositions.reduce((sum, position) => sum + (position.amountA || 0) + (position.amountB || 0), 0),
    lending: lendingPosition?.borrowValue || 0,
    governance: votes.length,
    spot: tokenBreakdown.reduce((sum, token) => sum + (token.value || 0), 0),
  };

  const largeMovements = transactions.filter((transaction) => (transaction.amount || 0) >= Math.max(currentValue * 0.08, 500)).length;
  const diversity = computeDiversity(tokenBreakdown, exposures);
  const risk = computeRisk(tokenBreakdown, exposures, transactions.length, followerCount, largeMovements, lendingPosition?.healthFactor || 999);
  const walletAgeDays = Math.max(1, Math.round((Date.now() - new Date(user?.createdAt || Date.now()).getTime()) / DAY_MS));
  const reputation = buildReputationScore({
    walletAgeDays,
    txCount: transactions.length,
    governanceVotes: votes.length,
    diversityScore: diversity.score,
    riskScore: risk.score,
    suspiciousSignals: largeMovements > 3 ? 1 : 0,
  });

  const derivedTags = dedupeTags([
    stakes.length ? "staker" : "",
    liquidityPositions.length ? "liquidity provider" : "",
    votes.length ? "governance participant" : "",
    currentValue >= 50000 ? "whale" : "",
    nftCount > 0 ? "collector" : "",
    transactions.length >= 12 ? "trader" : "",
  ]);

  return {
    user,
    walletAddress,
    currentValue: round(currentValue),
    previousValue: round(previousValue),
    change24h,
    tokenBreakdown,
    snapshots: latestSnapshots,
    transactions,
    nftCount,
    followerCount,
    followingCount,
    exposures,
    largeMovements,
    diversity,
    risk,
    reputation,
    walletAgeDays,
    latestActivityAt: transactions[0]?.blockTime || transactions[0]?.createdAt || latestSnapshot?.takenAt || user?.updatedAt || user?.createdAt || null,
    txCount: transactions.length,
    derivedTags,
  };
}

function buildBadgeCandidates(context) {
  const badges = [];

  if (context.walletAgeDays >= 90) {
    badges.push({ badgeKey: "early-adopter", badgeLabel: "Early Adopter", reason: "Wallet has remained active across multiple portfolio snapshot windows." });
  }
  if (context.exposures.staking > 0) {
    badges.push({ badgeKey: "top-staker", badgeLabel: "Top Staker", reason: "Wallet maintains active staking exposure on the protocol." });
  }
  if (context.exposures.governance >= 2) {
    badges.push({ badgeKey: "governance-voice", badgeLabel: "Governance Voice", reason: "Repeated proposal participation indicates strong governance engagement." });
  }
  if (context.txCount >= 10) {
    badges.push({ badgeKey: "power-trader", badgeLabel: "Power Trader", reason: "Recent mirrored transaction cadence is significantly above the baseline wallet activity level." });
  }
  if (context.exposures.liquidity > 0) {
    badges.push({ badgeKey: "liquidity-expert", badgeLabel: "Liquidity Expert", reason: "Wallet contributes liquidity and tracks fee-bearing positions." });
  }
  if (context.risk.score >= 74 && context.diversity.score >= 68) {
    badges.push({ badgeKey: "risk-aware", badgeLabel: "Risk Aware", reason: "Diversification and balanced exposure reduce protocol concentration risk." });
  }
  if (context.currentValue >= 50000) {
    badges.push({ badgeKey: "whale-wallet", badgeLabel: "Whale Wallet", reason: "Tracked portfolio value is materially above the average wallet in this environment." });
  }
  if (context.diversity.score >= 78) {
    badges.push({ badgeKey: "diversified-portfolio", badgeLabel: "Diversified Portfolio", reason: "Exposure remains well spread across assets and DeFi activities." });
  }
  if (context.nftCount > 0) {
    badges.push({ badgeKey: "nft-collector", badgeLabel: "NFT Collector", reason: "Wallet currently holds collectible or identity NFT assets." });
  }

  return badges;
}

async function syncWalletBadges(walletAddress, context) {
  const badges = buildBadgeCandidates(context).map((badge) => ({
    walletAddress,
    ...badge,
    assignedAt: new Date(),
  }));
  await WalletBadge.deleteMany({ walletAddress });
  if (badges.length > 0) {
    await WalletBadge.insertMany(badges);
  }
  return badges;
}

async function buildPublicProfilePayload(walletAddress, viewerUserId = null) {
  const [profile, context] = await Promise.all([
    PublicWalletProfile.findOne({ walletAddress }).lean(),
    fetchWalletContext(walletAddress),
  ]);

  const ownerId = context.user?._id ? String(context.user._id) : null;
  const isOwner = Boolean(viewerUserId && ownerId && String(viewerUserId) === ownerId);

  if (!profile) {
    return {
      walletAddress,
      displayName: shortAddress(walletAddress),
      visibility: "private",
      isAccessible: false,
      privateNotice: "No public profile found for this wallet.",
    };
  }

  if (!isOwner && profile.visibility === "private") {
    return {
      walletAddress,
      displayName: profile.displayName || shortAddress(walletAddress),
      avatar: profile.avatar || context.user?.avatar || "",
      visibility: profile.visibility,
      isAccessible: false,
      privateNotice: "This wallet profile is private and not available for public discovery.",
    };
  }

  const badges = await syncWalletBadges(walletAddress, context);
  const sharedSnapshots = await SharedPortfolioSnapshot.find({ walletAddress }).sort({ createdAt: -1 }).limit(8).lean();
  const topAssets = context.tokenBreakdown.slice(0, 3).map((token) => ({
    symbol: token.symbol,
    value: round(token.value),
    allocationPercent: round(token.allocationPercent, 2),
  }));
  const activity = context.transactions.slice(0, 10).map((transaction) =>
    buildActivityItem(walletAddress, profile.displayName || context.user?.name || shortAddress(walletAddress), transaction),
  );
  const summaryMode = !isOwner && profile.visibility === "summary";
  const isFollowing = viewerUserId
    ? Boolean(await WalletFollow.exists({ followerUserId: viewerUserId, followedWalletAddress: walletAddress }))
    : false;

  return {
    walletAddress,
    displayName: profile.displayName || context.user?.name || shortAddress(walletAddress),
    avatar: profile.avatar || context.user?.avatar || "",
    bio: profile.bio || "",
    tags: dedupeTags([...(profile.tags || []), ...context.derivedTags]),
    visibility: profile.visibility,
    isAccessible: true,
    isOwner,
    isFollowing,
    profileSettings: isOwner
      ? {
          isDiscoverable: profile.isDiscoverable,
          showInLeaderboards: profile.showInLeaderboards,
          showInTrending: profile.showInTrending,
          visibilitySettings: profile.visibilitySettings || {},
        }
      : undefined,
    socialStats: {
      followers: context.followerCount,
      following: context.followingCount,
    },
    badges: visibilityAllows(profile, "showBadges", isOwner) ? badges : [],
    reputation: visibilityAllows(profile, "showRisk", isOwner) ? context.reputation : null,
    summary: {
      portfolioValue: visibilityAllows(profile, "showPortfolioValue", isOwner) ? context.currentValue : null,
      portfolioChange24h: visibilityAllows(profile, "showPnl", isOwner) ? context.change24h : null,
      tokenAllocation: visibilityAllows(profile, "showTokenBalances", isOwner) && !summaryMode ? context.tokenBreakdown : [],
      topAssets,
      stakingExposure: visibilityAllows(profile, "showExposure", isOwner) ? round(context.exposures.staking) : null,
      liquidityExposure: visibilityAllows(profile, "showExposure", isOwner) ? round(context.exposures.liquidity) : null,
      lendingExposure: visibilityAllows(profile, "showExposure", isOwner) ? round(context.exposures.lending) : null,
      governanceParticipation: visibilityAllows(profile, "showExposure", isOwner) ? context.exposures.governance : null,
      nftCount: visibilityAllows(profile, "showNfts", isOwner) ? context.nftCount : null,
      transactionCount: context.txCount,
      latestActivityAt: context.latestActivityAt,
      firstSeenAt: context.user?.createdAt || context.snapshots.at(-1)?.takenAt || null,
      diversity: visibilityAllows(profile, "showRisk", isOwner) ? context.diversity : null,
      risk: visibilityAllows(profile, "showRisk", isOwner) ? context.risk : null,
      chart: context.snapshots
        .slice()
        .reverse()
        .map((snapshot) => ({
          label: new Date(snapshot.takenAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: snapshot.totalValue,
          pnl: snapshot.pnl || 0,
        })),
    },
    activity: visibilityAllows(profile, "showActivityFeed", isOwner) && !summaryMode ? activity : [],
    sharedSnapshots: visibilityAllows(profile, "showSnapshots", isOwner)
      ? sharedSnapshots.filter((snapshot) => isOwner || snapshot.visibility !== "private")
      : [],
  };
}

async function listPublicProfilesBase() {
  return PublicWalletProfile.find({
    visibility: { $ne: "private" },
    isDiscoverable: true,
  })
    .sort({ updatedAt: -1 })
    .lean();
}

async function computeSocialRecords(profiles) {
  return Promise.all(
    profiles.map(async (profile) => {
      const context = await fetchWalletContext(profile.walletAddress);
      const badges = await syncWalletBadges(profile.walletAddress, context);
      const displayName = profile.displayName || context.user?.name || shortAddress(profile.walletAddress);
      const trendScore = round(
        context.change24h * 1.4 +
          context.txCount * 2.2 +
          context.followerCount * 2 +
          context.exposures.governance * 5 +
          context.exposures.staking * 0.08 +
          context.exposures.liquidity * 0.02,
      );

      let trendReason = "increased on-chain activity";
      if (context.exposures.staking > context.exposures.liquidity && context.exposures.staking > context.exposures.governance) {
        trendReason = "highest staking growth";
      } else if (context.exposures.governance >= 2) {
        trendReason = "top governance participation this week";
      } else if (context.exposures.liquidity > 0) {
        trendReason = "large liquidity provider movement";
      } else if (context.txCount >= 8) {
        trendReason = "most active trader today";
      }

      return {
        walletAddress: profile.walletAddress,
        displayName,
        avatar: profile.avatar || context.user?.avatar || "",
        tags: dedupeTags([...(profile.tags || []), ...context.derivedTags]),
        currentValue: context.currentValue,
        change24h: context.change24h,
        followerCount: context.followerCount,
        risk: context.risk,
        diversity: context.diversity,
        reputation: context.reputation,
        txCount: context.txCount,
        nftCount: context.nftCount,
        exposures: context.exposures,
        trendScore,
        trendReason,
        badges,
        latestActivityAt: context.latestActivityAt,
      };
    }),
  );
}

function formatMetricValue(category, value) {
  if (["top-staker", "top-liquidity-provider", "highest-pnl-wallet"].includes(category)) {
    return `$${round(value).toLocaleString()}`;
  }
  if (category === "top-governance-voter" || category === "most-active-wallet") {
    return `${Math.round(value)} actions`;
  }
  if (category === "most-followed-wallet") {
    return `${Math.round(value)} followers`;
  }
  return round(value).toLocaleString();
}

export async function getPublicProfile(walletAddress, viewerUserId = null) {
  return buildPublicProfilePayload(walletAddress, viewerUserId);
}

export async function updatePublicProfile(userId, walletAddress, payload) {
  const user = await ensureOwnedProfile(userId, walletAddress);
  const profile = await getOrCreatePublicProfile(user, walletAddress);

  if (payload.displayName !== undefined) profile.displayName = payload.displayName;
  if (payload.avatar !== undefined) profile.avatar = payload.avatar;
  if (payload.bio !== undefined) profile.bio = payload.bio;
  if (payload.tags !== undefined) profile.tags = dedupeTags(payload.tags);
  if (payload.visibility !== undefined) profile.visibility = payload.visibility;
  if (payload.isDiscoverable !== undefined) profile.isDiscoverable = payload.isDiscoverable;
  if (payload.showInLeaderboards !== undefined) profile.showInLeaderboards = payload.showInLeaderboards;
  if (payload.showInTrending !== undefined) profile.showInTrending = payload.showInTrending;
  if (payload.visibilitySettings) {
    profile.visibilitySettings = {
      ...(profile.visibilitySettings?.toObject?.() || profile.visibilitySettings || {}),
      ...payload.visibilitySettings,
    };
  }

  await profile.save();
  return buildPublicProfilePayload(walletAddress, userId);
}

export async function followWallet(userId, walletAddress) {
  const profile = await PublicWalletProfile.findOne({ walletAddress }).lean();
  if (!profile || profile.visibility === "private") {
    throw new AppError("Only public wallets can be followed", 404);
  }

  const existing = await WalletFollow.findOne({ followerUserId: userId, followedWalletAddress: walletAddress });
  if (existing) {
    throw new AppError("Wallet already followed", 409);
  }

  await WalletFollow.create({ followerUserId: userId, followedWalletAddress: walletAddress });
  return {
    walletAddress,
    following: true,
    followers: await WalletFollow.countDocuments({ followedWalletAddress: walletAddress }),
  };
}

export async function unfollowWallet(userId, walletAddress) {
  await WalletFollow.deleteOne({ followerUserId: userId, followedWalletAddress: walletAddress });
  return {
    walletAddress,
    following: false,
    followers: await WalletFollow.countDocuments({ followedWalletAddress: walletAddress }),
  };
}

export async function getFollowingOverview(userId) {
  const follows = await WalletFollow.find({ followerUserId: userId }).sort({ createdAt: -1 }).lean();
  const wallets = await Promise.all(
    follows.map(async (follow) => {
      const profile = await buildPublicProfilePayload(follow.followedWalletAddress, userId);
      return {
        walletAddress: follow.followedWalletAddress,
        displayName: profile.displayName,
        avatar: profile.avatar || "",
        tags: profile.tags || [],
        followers: profile.socialStats?.followers || 0,
        portfolioValue: profile.summary?.portfolioValue,
        portfolioChange24h: profile.summary?.portfolioChange24h,
        reputation: profile.reputation,
        latestActivityAt: profile.summary?.latestActivityAt || null,
      };
    }),
  );

  const feedSources = await Promise.all(wallets.slice(0, 8).map((wallet) => buildPublicProfilePayload(wallet.walletAddress, userId)));
  const feed = feedSources
    .flatMap((profile) => [
      ...(profile.activity || []),
      ...((profile.sharedSnapshots || []).map((snapshot) => buildSnapshotShareItem(snapshot, profile.displayName)) || []),
    ])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 16);

  return {
    wallets,
    feed,
  };
}

export async function getTrendingWallets(limit = 8) {
  const profiles = await listPublicProfilesBase();
  const records = await computeSocialRecords(profiles.filter((profile) => profile.showInTrending));

  return records
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit)
    .map((record, index) => ({
      rank: index + 1,
      walletAddress: record.walletAddress,
      displayName: record.displayName,
      avatar: record.avatar,
      tags: record.tags,
      badges: record.badges,
      trendReason: record.trendReason,
      followerCount: record.followerCount,
      valueChange: record.change24h,
      currentValue: record.currentValue,
      activitySummary: `${record.txCount} mirrored actions, ${record.nftCount} NFTs, ${record.exposures.governance} governance signals`,
      riskLabel: record.risk.label,
      reputation: record.reputation,
      trendScore: record.trendScore,
      latestActivityAt: record.latestActivityAt,
    }));
}

export async function getLeaderboards(period = "7d") {
  const profiles = await PublicWalletProfile.find({
    visibility: { $ne: "private" },
    showInLeaderboards: true,
  }).lean();
  const records = await computeSocialRecords(profiles);
  const previousSnapshots = await WalletLeaderboardSnapshot.find({ period }).sort({ createdAt: -1 }).lean();
  const previousRankMap = new Map(previousSnapshots.map((entry) => [`${entry.category}:${entry.walletAddress}`, entry.rank]));

  const categories = [
    { key: "top-staker", label: "Top staker this week", description: "Highest active staking exposure among public wallets.", metric: (record) => record.exposures.staking },
    { key: "top-trader", label: "Top trader", description: "Strongest mirrored trading throughput in the selected period.", metric: (record) => record.txCount * Math.max(record.currentValue * 0.02, 1) },
    { key: "top-governance-voter", label: "Top governance voter", description: "Most active governance participation across public wallets.", metric: (record) => record.exposures.governance },
    { key: "top-liquidity-provider", label: "Top liquidity provider", description: "Largest active liquidity footprint.", metric: (record) => record.exposures.liquidity },
    { key: "highest-pnl-wallet", label: "Highest PnL wallet", description: "Strongest visible 24h performance signal.", metric: (record) => record.currentValue * (record.change24h / 100) },
    { key: "most-diversified-wallet", label: "Most diversified wallet", description: "Highest diversity score among visible portfolios.", metric: (record) => record.diversity.score },
    { key: "most-followed-wallet", label: "Most followed wallet", description: "Largest follower network across the platform.", metric: (record) => record.followerCount },
    { key: "most-active-wallet", label: "Most active wallet", description: "Highest recent on-chain activity count.", metric: (record) => record.txCount },
  ];

  const leaderboardPayload = categories.map((category) => {
    const items = records
      .map((record) => ({
        ...record,
        metricValue: round(category.metric(record), 2),
      }))
      .sort((a, b) => b.metricValue - a.metricValue)
      .slice(0, LEADERBOARD_LIMIT)
      .map((record, index) => {
        const previousRank = previousRankMap.get(`${category.key}:${record.walletAddress}`);
        const movement = previousRank === undefined ? "new" : previousRank > index + 1 ? "up" : previousRank < index + 1 ? "down" : "unchanged";

        return {
          rank: index + 1,
          walletAddress: record.walletAddress,
          displayName: record.displayName,
          avatar: record.avatar,
          badge: record.badges[0]?.badgeLabel || record.risk.label,
          metricValue: record.metricValue,
          metricLabel: formatMetricValue(category.key, record.metricValue),
          movement,
          followerCount: record.followerCount,
          change24h: record.change24h,
        };
      });

    return {
      key: category.key,
      label: category.label,
      description: category.description,
      period,
      items,
    };
  });

  await WalletLeaderboardSnapshot.deleteMany({ period });
  const rows = leaderboardPayload.flatMap((category) =>
    category.items.map((item) => ({
      category: category.key,
      walletAddress: item.walletAddress,
      metricValue: item.metricValue,
      rank: item.rank,
      period,
      movement: item.movement,
    })),
  );
  if (rows.length > 0) {
    await WalletLeaderboardSnapshot.insertMany(rows);
  }

  return leaderboardPayload;
}

export async function sharePortfolioSnapshot(userId, payload) {
  await ensureOwnedProfile(userId, payload.walletAddress);
  const profile = await PublicWalletProfile.findOne({ walletAddress: payload.walletAddress }).lean();
  const context = await fetchWalletContext(payload.walletAddress);

  const summaryData = {
    portfolioValue: payload.includePortfolioValue ? context.currentValue : null,
    pnl: payload.includePnl ? round(context.currentValue - (context.previousValue || context.currentValue), 2) : null,
    allocation: payload.includeAllocation ? context.tokenBreakdown.slice(0, 5) : [],
    topAssets: context.tokenBreakdown.slice(0, 3),
    stakingExposure: round(context.exposures.staking),
    riskScore: payload.includeRiskScore ? context.risk.score : null,
    timeframe: payload.timeframe,
    displayName: profile?.displayName || context.user?.name || shortAddress(payload.walletAddress),
  };

  return SharedPortfolioSnapshot.create({
    userId,
    walletAddress: payload.walletAddress,
    title: payload.title,
    timeframe: payload.timeframe,
    visibility: payload.visibility,
    summaryData,
  });
}

export async function getSharedSnapshots(walletAddress, viewerUserId = null) {
  const profile = await PublicWalletProfile.findOne({ walletAddress }).lean();
  const contextUser = await findUserByWallet(walletAddress);
  const isOwner = Boolean(viewerUserId && contextUser?._id && String(viewerUserId) === String(contextUser._id));

  if (!profile && !isOwner) {
    return [];
  }

  const snapshots = await SharedPortfolioSnapshot.find({ walletAddress }).sort({ createdAt: -1 }).limit(12).lean();
  return snapshots.filter((snapshot) => isOwner || snapshot.visibility !== "private");
}

export async function getWalletBadges(walletAddress, viewerUserId = null) {
  const profile = await PublicWalletProfile.findOne({ walletAddress }).lean();
  const contextUser = await findUserByWallet(walletAddress);
  const isOwner = Boolean(viewerUserId && contextUser?._id && String(viewerUserId) === String(contextUser._id));
  if (profile?.visibility === "private" && !isOwner) {
    return [];
  }
  const context = await fetchWalletContext(walletAddress);
  return syncWalletBadges(walletAddress, context);
}

export async function searchPublicWallets(query) {
  const profiles = await listPublicProfilesBase();
  const records = await computeSocialRecords(profiles);

  return records
    .filter((record) => {
      const matchesQuery = query.q
        ? [record.displayName, record.walletAddress, ...record.tags, ...record.badges.map((badge) => badge.badgeLabel)]
            .join(" ")
            .toLowerCase()
            .includes(query.q.toLowerCase())
        : true;
      const matchesTag = query.tag ? record.tags.some((tag) => tag.toLowerCase() === query.tag.toLowerCase()) : true;
      const matchesBadge = query.badge ? record.badges.some((badge) => badge.badgeLabel.toLowerCase().includes(query.badge.toLowerCase())) : true;
      return matchesQuery && matchesTag && matchesBadge;
    })
    .sort((a, b) => {
      if (query.sort === "followers") {
        return b.followerCount - a.followerCount;
      }
      if (query.sort === "value") {
        return b.currentValue - a.currentValue;
      }
      return b.trendScore - a.trendScore;
    })
    .map((record) => ({
      walletAddress: record.walletAddress,
      displayName: record.displayName,
      avatar: record.avatar,
      tags: record.tags,
      badges: record.badges,
      currentValue: record.currentValue,
      change24h: record.change24h,
      followerCount: record.followerCount,
      risk: record.risk,
      diversity: record.diversity,
      reputation: record.reputation,
      latestActivityAt: record.latestActivityAt,
    }));
}

export async function getSocialFeed({ walletAddress = null, scope = "global" } = {}) {
  if (scope === "wallet" && walletAddress) {
    const profile = await buildPublicProfilePayload(walletAddress, null);
    if (!profile.isAccessible) {
      return [];
    }
    return [
      ...(profile.activity || []),
      ...((profile.sharedSnapshots || []).map((snapshot) => buildSnapshotShareItem(snapshot, profile.displayName)) || []),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }

  const profiles = await listPublicProfilesBase();
  const feeds = await Promise.all(profiles.slice(0, 6).map((profile) => buildPublicProfilePayload(profile.walletAddress, null)));
  return feeds
    .flatMap((profile) => [
      ...(profile.activity || []),
      ...((profile.sharedSnapshots || []).map((snapshot) => buildSnapshotShareItem(snapshot, profile.displayName)) || []),
    ])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
}
