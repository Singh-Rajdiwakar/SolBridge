import { LendingPosition } from "../models/LendingPosition.js";
import { LiquidityPosition } from "../models/LiquidityPosition.js";
import { MarketPriceSnapshot } from "../models/MarketPriceSnapshot.js";
import { Pool } from "../models/Pool.js";
import { PortfolioSnapshot } from "../models/PortfolioSnapshot.js";
import { Stake } from "../models/Stake.js";
import { Token } from "../models/Token.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { getWalletPortfolio } from "./wallet.service.js";

const STABLECOINS = new Set(["USDC", "USDT", "DAI", "USDS", "PYUSD"]);
const RANGE_DAYS = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "1Y": 365,
};
const RISK_WEIGHTS = {
  volatility: 0.35,
  borrow: 0.3,
  liquidity: 0.2,
  concentration: 0.15,
};
const STRESS_SCENARIOS = {
  "sol-drop-10": {
    key: "sol-drop-10",
    label: "SOL drops 10%",
    description: "Volatile asset exposure reprices lower as SOL retraces 10%.",
    volatilityMultiplier: 1.14,
    totalValueImpactPercent: -6,
    concentrationDelta: 6,
    borrowDelta: 4,
    liquidityDelta: 3,
  },
  "sol-drop-20": {
    key: "sol-drop-20",
    label: "SOL drops 20%",
    description: "Broad SOL-linked exposure is stressed by a deeper retracement.",
    volatilityMultiplier: 1.28,
    totalValueImpactPercent: -11,
    concentrationDelta: 8,
    borrowDelta: 7,
    liquidityDelta: 5,
  },
  "lp-divergence-15": {
    key: "lp-divergence-15",
    label: "LP pair diverges 15%",
    description: "Impermanent loss pressure increases for volatile liquidity pair positions.",
    volatilityMultiplier: 1.08,
    totalValueImpactPercent: -4,
    concentrationDelta: 2,
    borrowDelta: 0,
    liquidityDelta: 14,
  },
  "borrowed-asset-up-10": {
    key: "borrowed-asset-up-10",
    label: "Borrowed asset rises 10%",
    description: "Debt servicing burden increases as the borrowed asset appreciates.",
    volatilityMultiplier: 1.03,
    totalValueImpactPercent: -3,
    concentrationDelta: 1,
    borrowDelta: 18,
    liquidityDelta: 0,
  },
  "stable-buffer": {
    key: "stable-buffer",
    label: "Stablecoin allocation rises",
    description: "Additional stable reserves improve downside protection and reduce volatility.",
    volatilityMultiplier: 0.84,
    totalValueImpactPercent: 1.5,
    concentrationDelta: -8,
    borrowDelta: -4,
    liquidityDelta: -5,
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function riskLabel(score) {
  if (score <= 35) return "Low Risk";
  if (score <= 65) return "Moderate Risk";
  if (score <= 85) return "High Risk";
  return "Critical Risk";
}

function liquidityLabel(score) {
  if (score <= 25) return "Low IL Risk";
  if (score <= 55) return "Moderate IL Risk";
  if (score <= 80) return "Elevated IL Risk";
  return "High IL Risk";
}

function concentrationLabel(score) {
  if (score <= 30) return "Diversified";
  if (score <= 60) return "Moderate Concentration";
  return "Concentrated";
}

function volatilityLabel(score) {
  if (score <= 30) return "Low";
  if (score <= 60) return "Moderate";
  if (score <= 80) return "Elevated";
  return "High";
}

function borrowWarningLevel(healthFactor) {
  if (!healthFactor || healthFactor >= 2) return "Safe";
  if (healthFactor >= 1.55) return "Watch";
  if (healthFactor >= 1.2) return "High Alert";
  return "Liquidation Risk";
}

function trendDirection(delta) {
  if (delta >= 4) return "Risk rising";
  if (delta <= -4) return "Risk improving";
  return "Stable risk";
}

function getMajorContributor(scores) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "volatility";
}

function summarizeContributor(key) {
  switch (key) {
    case "borrow":
      return "Borrow-driven";
    case "liquidity":
      return "Liquidity-driven";
    case "concentration":
      return "Concentration-driven";
    default:
      return "Volatility-driven";
  }
}

function stableRatioForBreakdown(tokens, totalValue) {
  return totalValue
    ? tokens
        .filter((token) => STABLECOINS.has(token.symbol))
        .reduce((sum, token) => sum + (token.value || 0), 0) / totalValue
    : 0;
}

function getSymbolBaseVolatility(symbol) {
  if (STABLECOINS.has(symbol)) return 6;

  return {
    BTC: 18,
    ETH: 24,
    SOL: 46,
    MSOL: 42,
    JITOSOL: 40,
    GOV: 58,
    RTX: 64,
    RAY: 57,
    BONK: 82,
  }[symbol] ?? 54;
}

function toMapByLatest(items, key) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item[key])) {
      map.set(item[key], item);
    }
  }
  return map;
}

function getTokenPrice(symbol, marketMap, tokenMap) {
  if (STABLECOINS.has(symbol)) {
    return 1;
  }

  return marketMap.get(symbol)?.price || tokenMap.get(symbol)?.price || 0;
}

function getTokenVolatility(symbol, marketMap) {
  const snapshot = marketMap.get(symbol);
  const base = getSymbolBaseVolatility(symbol);
  const marketAdjustment = snapshot
    ? Math.min(Math.abs(snapshot.change24h || 0) * 0.75 + Math.abs(snapshot.change7d || 0) * 0.22, 22)
    : 0;
  return clamp(round(base + marketAdjustment, 2), 4, 96);
}

function normalizeTokenBreakdown(totalValue, tokens) {
  return tokens
    .map((token) => ({
      symbol: token.symbol,
      amount: Number(token.amount || token.balance || 0),
      price: Number(token.price || 0),
      value: Number(token.value || token.usdValue || 0),
      allocationPercent: totalValue ? round((Number(token.value || token.usdValue || 0) / totalValue) * 100, 2) : 0,
    }))
    .filter((token) => token.value > 0)
    .sort((a, b) => b.value - a.value);
}

function buildPortfolioSnapshotFallback(portfolio) {
  const totalValue = Number(portfolio.totalPortfolioUsd || 0);
  return {
    totalValue,
    tokenBreakdown: normalizeTokenBreakdown(totalValue, portfolio.tokens || []),
    takenAt: new Date(),
  };
}

async function ensureAccessibleWallet(userId, requestedWalletAddress) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const walletAddress = requestedWalletAddress || user.walletAddress;
  const allowed = new Set([user.walletAddress, ...(user.linkedWallets || []).map((wallet) => wallet.address)]);

  if (!allowed.has(walletAddress)) {
    throw new AppError("Wallet is not linked to this user.", 403);
  }

  return { walletAddress };
}

function buildVolatilityRisk(tokens, totalValue, marketMap) {
  if (!tokens.length || totalValue <= 0) {
    return {
      score: 0,
      label: "Low",
      contributionPercent: 0,
      stablecoinRatio: 0,
      topVolatileAssets: [],
      explanation: "No portfolio holdings available to evaluate volatility risk.",
    };
  }

  const stablecoinRatio = stableRatioForBreakdown(tokens, totalValue);
  const largestAssetRatio = (tokens[0]?.value || 0) / totalValue;
  const topVolatileAssets = tokens
    .map((token) => ({
      symbol: token.symbol,
      allocationPercent: token.allocationPercent,
      volatilityScore: getTokenVolatility(token.symbol, marketMap),
    }))
    .sort((a, b) => b.volatilityScore * b.allocationPercent - a.volatilityScore * a.allocationPercent)
    .slice(0, 4);

  const weightedVolatility = tokens.reduce((sum, token) => {
    const ratio = token.value / totalValue;
    return sum + ratio * getTokenVolatility(token.symbol, marketMap);
  }, 0);

  const score = clamp(
    round(weightedVolatility - stablecoinRatio * 18 + Math.max(0, largestAssetRatio - 0.35) * 38, 2),
    0,
    100,
  );

  return {
    score,
    label: volatilityLabel(score),
    contributionPercent: round(weightedVolatility, 2),
    stablecoinRatio: round(stablecoinRatio * 100, 2),
    topVolatileAssets,
    explanation:
      stablecoinRatio >= 0.2
        ? "Stablecoin reserve is helping dampen portfolio volatility."
        : `${topVolatileAssets[0]?.symbol || "A major asset"} contributes the largest share of volatility exposure.`,
  };
}

function buildBorrowRisk(position, totalVisibleValue) {
  if (!position || position.borrowValue <= 0) {
    return {
      score: 0,
      label: "Low Risk",
      healthFactor: null,
      liquidationWarningLevel: "No borrow exposure",
      debtToCollateralRatio: 0,
      recommendedSafeZone: "Target health factor above 1.8",
      explanation: "No active borrowed amount detected for this wallet.",
      borrowedShare: 0,
    };
  }

  const debtToCollateralRatio = position.collateralValue
    ? (position.borrowValue / Math.max(position.collateralValue, 1)) * 100
    : 100;
  const borrowedShare = totalVisibleValue ? (position.borrowValue / totalVisibleValue) * 100 : 0;
  const healthFactor = position.healthFactor || 0;

  const score = clamp(
    round(
      debtToCollateralRatio * 0.56 +
        Math.max(0, 2 - healthFactor) * 34 +
        Math.max(0, borrowedShare - 8) * 0.85,
      2,
    ),
    0,
    100,
  );

  return {
    score,
    label: riskLabel(score),
    healthFactor: round(healthFactor, 2),
    liquidationWarningLevel: borrowWarningLevel(healthFactor),
    debtToCollateralRatio: round(debtToCollateralRatio, 2),
    recommendedSafeZone: "Maintain health factor above 1.8 and debt ratio below 45%.",
    explanation:
      healthFactor < 1.5
        ? "Health factor is approaching a liquidation-sensitive zone."
        : "Borrow exposure is manageable relative to current collateral coverage.",
    borrowedShare: round(borrowedShare, 2),
  };
}

function buildLiquidityRisk(liquidityPositions, totalVisibleValue) {
  if (!liquidityPositions.length) {
    return {
      score: 0,
      label: "Low IL Risk",
      portfolioInPoolsPercent: 0,
      ilRiskLabel: "No LP Exposure",
      estimatedImpermanentLossPressure: 0,
      protocolConcentrationPercent: 0,
      topRiskyPools: [],
      explanation: "No liquidity pool exposure detected for this wallet.",
    };
  }

  const liquidityValue = liquidityPositions.reduce((sum, item) => sum + item.value, 0);
  const volatileExposure = liquidityPositions.reduce(
    (sum, item) => sum + (item.isVolatilePair ? item.value : item.value * 0.35),
    0,
  );
  const largestPoolShare = liquidityValue ? Math.max(...liquidityPositions.map((item) => item.value)) / liquidityValue : 0;
  const volatileRatio = liquidityValue ? volatileExposure / liquidityValue : 0;
  const portfolioInPoolsPercent = totalVisibleValue ? (liquidityValue / totalVisibleValue) * 100 : 0;
  const estimatedImpermanentLossPressure = round(volatileRatio * 62 + largestPoolShare * 26, 2);
  const score = clamp(
    round(
      portfolioInPoolsPercent * 0.8 +
        estimatedImpermanentLossPressure * 0.55 +
        Math.max(0, largestPoolShare - 0.4) * 38,
      2,
    ),
    0,
    100,
  );

  return {
    score,
    label: riskLabel(score),
    portfolioInPoolsPercent: round(portfolioInPoolsPercent, 2),
    ilRiskLabel: liquidityLabel(score),
    estimatedImpermanentLossPressure,
    protocolConcentrationPercent: round(largestPoolShare * 100, 2),
    topRiskyPools: liquidityPositions
      .slice()
      .sort((a, b) => b.riskIndex - a.riskIndex)
      .slice(0, 4)
      .map((item) => ({
        pair: item.pair,
        value: round(item.value, 2),
        riskIndex: round(item.riskIndex, 2),
        isVolatilePair: item.isVolatilePair,
      })),
    explanation:
      volatileRatio > 0.65
        ? "High exposure to volatile LP pairs increases impermanent loss sensitivity."
        : "Liquidity mix is relatively controlled, though pool concentration still matters.",
  };
}

function buildConcentrationRisk(tokens, totalValue, exposures) {
  if (!tokens.length || totalValue <= 0) {
    return {
      score: 0,
      label: "Diversified",
      largestAssetPercent: 0,
      top3AssetsPercent: 0,
      diversificationLabel: "No Data",
      explanation: "Portfolio concentration cannot be evaluated until holdings are available.",
    };
  }

  const largestAssetPercent = round(((tokens[0]?.value || 0) / totalValue) * 100, 2);
  const top3AssetsPercent = round((tokens.slice(0, 3).reduce((sum, token) => sum + token.value, 0) / totalValue) * 100, 2);
  const activeExposureBuckets = [exposures.staking, exposures.liquidity, exposures.lending, exposures.spot].filter((value) => value > 0).length;

  const score = clamp(
    round(
      largestAssetPercent * 0.72 +
        Math.max(0, top3AssetsPercent - 70) * 0.42 -
        Math.min(activeExposureBuckets * 4, 12),
      2,
    ),
    0,
    100,
  );

  return {
    score,
    label: riskLabel(score),
    largestAssetPercent,
    top3AssetsPercent,
    diversificationLabel: concentrationLabel(score),
    explanation:
      largestAssetPercent >= 55
        ? `Portfolio is heavily concentrated in ${tokens[0]?.symbol || "one asset"}.`
        : activeExposureBuckets >= 4
          ? "Exposure is spread across multiple protocol buckets and token groups."
          : "Asset concentration is moderate but still worth monitoring.",
  };
}

function buildProtocolExposure({ totalValue, stakingValue, liquidityValue, borrowValue, governanceValue }) {
  const totalExposureBase = Math.max(totalValue + stakingValue + liquidityValue, 1);
  const spotValue = Math.max(totalValue - governanceValue, 0);

  return [
    { key: "spot", label: "Spot Holdings", value: round(spotValue, 2), percentage: round((spotValue / totalExposureBase) * 100, 2) },
    { key: "staking", label: "Staking", value: round(stakingValue, 2), percentage: round((stakingValue / totalExposureBase) * 100, 2) },
    { key: "liquidity", label: "Liquidity", value: round(liquidityValue, 2), percentage: round((liquidityValue / totalExposureBase) * 100, 2) },
    { key: "lending", label: "Borrow Exposure", value: round(borrowValue, 2), percentage: round((borrowValue / totalExposureBase) * 100, 2) },
    { key: "governance", label: "Governance Hold", value: round(governanceValue, 2), percentage: round((governanceValue / totalExposureBase) * 100, 2) },
  ].filter((entry) => entry.value > 0);
}

function buildRecommendations({ totalRiskScore, volatilityRisk, borrowRisk, liquidityRisk, concentrationRisk, tokens }) {
  const recommendations = [];

  if (concentrationRisk.score >= 55) {
    recommendations.push({
      title: "Reduce concentration",
      detail: `${tokens[0]?.symbol || "Top asset"} dominates visible allocation. Rebalancing into secondary assets or stable reserves would reduce concentration pressure.`,
      severity: "high",
    });
  }

  if (borrowRisk.score >= 50) {
    recommendations.push({
      title: "Lower borrow exposure",
      detail: "Repaying a portion of debt or adding collateral would improve health factor and liquidation distance.",
      severity: borrowRisk.healthFactor && borrowRisk.healthFactor < 1.5 ? "high" : "medium",
    });
  }

  if (liquidityRisk.score >= 45) {
    recommendations.push({
      title: "Trim volatile LP exposure",
      detail: "Stable pair liquidity or reduced pool concentration would lower impermanent loss sensitivity.",
      severity: "medium",
    });
  }

  if (volatilityRisk.score >= 50) {
    recommendations.push({
      title: "Increase stable reserve",
      detail: "Adding stablecoin allocation can reduce overall portfolio volatility and improve resilience.",
      severity: "medium",
    });
  }

  if (totalRiskScore <= 35) {
    recommendations.push({
      title: "Risk posture looks healthy",
      detail: "Portfolio resilience is solid. Keep monitoring borrow health factor and large allocation shifts.",
      severity: "low",
    });
  }

  return recommendations.slice(0, 4);
}

function buildRiskEvents(transactions, snapshots, latestMetrics) {
  const events = [];
  const baselineAmount = transactions.length
    ? transactions.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0) / transactions.length
    : 0;

  transactions.slice(0, 36).forEach((transaction) => {
    const amount = Math.abs(transaction.amount || 0);
    if (transaction.protocolModule === "lending" && amount > 0) {
      events.push({
        id: transaction.signature,
        eventType: "borrow-adjustment",
        description: `${transaction.type} changed lending exposure in ${transaction.tokenSymbol || "SOL"}.`,
        severity: latestMetrics.borrowRisk.score >= 50 ? "high" : "medium",
        relatedAsset: transaction.tokenSymbol || "SOL",
        createdAt: transaction.blockTime || transaction.createdAt,
      });
    } else if (transaction.protocolModule === "liquidity" && amount > 0) {
      events.push({
        id: transaction.signature,
        eventType: "liquidity-shift",
        description: `${transaction.type} adjusted LP exposure and potential IL sensitivity.`,
        severity: latestMetrics.liquidityRisk.score >= 45 ? "medium" : "low",
        relatedAsset: transaction.tokenSymbol || "LP",
        createdAt: transaction.blockTime || transaction.createdAt,
      });
    } else if (transaction.status === "failed") {
      events.push({
        id: transaction.signature,
        eventType: "failed-transaction",
        description: "A failed mirrored transaction may indicate execution friction or stale routes.",
        severity: "medium",
        relatedAsset: transaction.tokenSymbol || "SOL",
        createdAt: transaction.blockTime || transaction.createdAt,
      });
    } else if (baselineAmount > 0 && amount >= baselineAmount * 3.2) {
      events.push({
        id: transaction.signature,
        eventType: "large-movement",
        description: "Unusually large transaction size increased movement and concentration risk.",
        severity: "high",
        relatedAsset: transaction.tokenSymbol || "SOL",
        createdAt: transaction.blockTime || transaction.createdAt,
      });
    }
  });

  for (let index = 0; index < snapshots.length - 1; index += 1) {
    const current = snapshots[index];
    const previous = snapshots[index + 1];
    if (!previous?.totalValue) {
      continue;
    }
    const drawdownPercent = ((current.totalValue - previous.totalValue) / previous.totalValue) * 100;
    if (drawdownPercent <= -8) {
      events.push({
        id: `snapshot-drop-${current._id || current.takenAt}`,
        eventType: "drawdown",
        description: `Portfolio value declined ${round(Math.abs(drawdownPercent), 2)}% between snapshots.`,
        severity: drawdownPercent <= -15 ? "high" : "medium",
        relatedAsset: current.tokenBreakdown?.[0]?.symbol || "Portfolio",
        createdAt: current.takenAt,
      });
    }
  }

  return events
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 18);
}

function buildTrendSeries({ range, snapshots, currentBorrowRisk, currentLiquidityRisk, marketMap, totalVisibleValue }) {
  const days = RANGE_DAYS[range];
  const since = Date.now() - days * 86400000;
  const filtered = snapshots
    .filter((snapshot) => new Date(snapshot.takenAt).getTime() >= since)
    .slice()
    .reverse();

  const baseSeries = filtered.length
    ? filtered
    : snapshots.slice(0, Math.min(snapshots.length, 8)).reverse();

  return baseSeries.map((snapshot, index) => {
    const totalValue = snapshot.totalValue || snapshot.tokenBreakdown.reduce((sum, token) => sum + (token.value || 0), 0);
    const volatilityRisk = buildVolatilityRisk(snapshot.tokenBreakdown || [], totalValue, marketMap).score;
    const concentrationRisk = buildConcentrationRisk(
      snapshot.tokenBreakdown || [],
      totalValue,
      { staking: 0, liquidity: 0, lending: 0, spot: totalVisibleValue },
    ).score;

    const wave = Math.sin((index + 1) * 1.17);
    const borrowRisk = clamp(round(currentBorrowRisk * (0.82 + wave * 0.08), 2), 0, 100);
    const liquidityRisk = clamp(round(currentLiquidityRisk * (0.8 + Math.cos((index + 1) * 0.9) * 0.09), 2), 0, 100);
    const totalRiskScore = clamp(
      round(
        volatilityRisk * RISK_WEIGHTS.volatility +
          borrowRisk * RISK_WEIGHTS.borrow +
          liquidityRisk * RISK_WEIGHTS.liquidity +
          concentrationRisk * RISK_WEIGHTS.concentration,
        2,
      ),
      0,
      100,
    );

    return {
      label: new Date(snapshot.takenAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      date: snapshot.takenAt,
      totalRiskScore,
      volatilityRisk: round(volatilityRisk, 2),
      borrowRisk: round(borrowRisk, 2),
      liquidityRisk: round(liquidityRisk, 2),
      concentrationRisk: round(concentrationRisk, 2),
    };
  });
}

async function buildRiskContext(userId, requestedWalletAddress) {
  const { walletAddress } = await ensureAccessibleWallet(userId, requestedWalletAddress);
  let snapshots = await PortfolioSnapshot.find({ walletAddress }).sort({ takenAt: -1 }).limit(32).lean();

  if (!snapshots.length) {
    const fallbackPortfolio = await getWalletPortfolio(userId, walletAddress, "Retix Wallet");
    snapshots = [buildPortfolioSnapshotFallback(fallbackPortfolio)];
  }

  const currentSnapshot = snapshots[0];
  const tokens = normalizeTokenBreakdown(currentSnapshot.totalValue || 0, currentSnapshot.tokenBreakdown || []);
  const transactionMirrors = await TransactionMirror.find({ walletAddress })
    .sort({ blockTime: -1, createdAt: -1 })
    .limit(120)
    .lean();

  const [stakes, lendingPosition, liquidityPositions, liquidityPools] = await Promise.all([
    Stake.find({ userId, status: "active" }).lean(),
    LendingPosition.findOne({ userId }).lean(),
    LiquidityPosition.find({ userId }).lean(),
    Pool.find().lean(),
  ]);

  const priceSymbols = new Set(tokens.map((token) => token.symbol));
  stakes.forEach((stake) => priceSymbols.add(stake.tokenSymbol));
  liquidityPools.forEach((pool) => {
    priceSymbols.add(pool.tokenA);
    priceSymbols.add(pool.tokenB);
  });

  const [marketSnapshots, tokenCatalog] = await Promise.all([
    MarketPriceSnapshot.find({ symbol: { $in: Array.from(priceSymbols) } }).sort({ fetchedAt: -1 }).lean(),
    Token.find({ symbol: { $in: Array.from(priceSymbols) } }).lean(),
  ]);

  const marketMap = toMapByLatest(marketSnapshots, "symbol");
  const tokenMap = new Map(tokenCatalog.map((token) => [token.symbol, token]));
  const totalValue = currentSnapshot.totalValue || tokens.reduce((sum, token) => sum + token.value, 0);

  const stakingValue = round(
    stakes.reduce(
      (sum, stake) => sum + Number(stake.amount || 0) * getTokenPrice(stake.tokenSymbol, marketMap, tokenMap),
      0,
    ),
    2,
  );

  const poolMap = new Map(liquidityPools.map((pool) => [String(pool._id), pool]));
  const normalizedLiquidityPositions = liquidityPositions.map((position) => {
    const pool = poolMap.get(String(position.poolId));
    const tokenA = pool?.tokenA || "SOL";
    const tokenB = pool?.tokenB || "USDC";
    const value =
      Number(position.amountA || 0) * getTokenPrice(tokenA, marketMap, tokenMap) +
      Number(position.amountB || 0) * getTokenPrice(tokenB, marketMap, tokenMap);
    const stablePair = STABLECOINS.has(tokenA) && STABLECOINS.has(tokenB);
    const volatilePair = !stablePair && (!STABLECOINS.has(tokenA) || !STABLECOINS.has(tokenB));
    const riskIndex = value > 0 ? (volatilePair ? 76 : 34) + Math.min((position.feesEarned || 0) * 0.12, 8) : 0;

    return {
      pair: pool?.pair || `${tokenA}/${tokenB}`,
      value,
      isVolatilePair: volatilePair,
      riskIndex,
    };
  });

  const governanceValue = tokens
    .filter((token) => token.symbol === "GOV")
    .reduce((sum, token) => sum + token.value, 0);

  const totalVisibleValue = Math.max(totalValue + stakingValue + normalizedLiquidityPositions.reduce((sum, item) => sum + item.value, 0), 1);

  return {
    walletAddress,
    snapshots,
    tokens,
    transactionMirrors,
    marketMap,
    totalValue,
    totalVisibleValue,
    stakingValue,
    lendingPosition,
    liquidityPositions: normalizedLiquidityPositions,
    governanceValue,
  };
}

function buildRiskDataset(context) {
  const volatilityRisk = buildVolatilityRisk(context.tokens, context.totalValue, context.marketMap);
  const borrowRisk = buildBorrowRisk(context.lendingPosition, context.totalVisibleValue);
  const liquidityRisk = buildLiquidityRisk(context.liquidityPositions, context.totalVisibleValue);
  const concentrationRisk = buildConcentrationRisk(context.tokens, context.totalValue, {
    staking: context.stakingValue,
    liquidity: context.liquidityPositions.reduce((sum, item) => sum + item.value, 0),
    lending: context.lendingPosition?.borrowValue || 0,
    spot: context.totalValue,
  });

  const totalRiskScore = clamp(
    round(
      volatilityRisk.score * RISK_WEIGHTS.volatility +
        borrowRisk.score * RISK_WEIGHTS.borrow +
        liquidityRisk.score * RISK_WEIGHTS.liquidity +
        concentrationRisk.score * RISK_WEIGHTS.concentration,
      2,
    ),
    0,
    100,
  );

  const categoryScores = {
    volatility: round(volatilityRisk.score, 2),
    borrow: round(borrowRisk.score, 2),
    liquidity: round(liquidityRisk.score, 2),
    concentration: round(concentrationRisk.score, 2),
  };

  const trendSeries = buildTrendSeries({
    range: "30D",
    snapshots: context.snapshots,
    currentBorrowRisk: borrowRisk.score,
    currentLiquidityRisk: liquidityRisk.score,
    marketMap: context.marketMap,
    totalVisibleValue: context.totalVisibleValue,
  });
  const trendDelta = trendSeries.length >= 2
    ? trendSeries[trendSeries.length - 1].totalRiskScore - trendSeries[0].totalRiskScore
    : 0;

  const majorContributor = getMajorContributor(categoryScores);
  const recommendations = buildRecommendations({
    totalRiskScore,
    volatilityRisk,
    borrowRisk,
    liquidityRisk,
    concentrationRisk,
    tokens: context.tokens,
  });

  return {
    totalRiskScore: round(totalRiskScore, 2),
    riskLabel: riskLabel(totalRiskScore),
    volatilityRisk,
    borrowRisk,
    liquidityRisk,
    concentrationRisk,
    categoryScores,
    majorContributor: summarizeContributor(majorContributor),
    explanationSummary:
      totalRiskScore > 65
        ? `${summarizeContributor(majorContributor)} pressure is pushing the portfolio into a higher-risk posture.`
        : `${summarizeContributor(majorContributor)} remains the main driver, but overall portfolio risk is still manageable.`,
    thresholds: {
      lowRiskMax: 35,
      moderateRiskMax: 65,
      highRiskMax: 85,
      criticalRiskMin: 86,
      safeHealthFactor: 1.8,
      highLpExposurePercent: 25,
      highConcentrationPercent: 55,
      riskyDebtRatioPercent: 45,
    },
    protocolExposure: buildProtocolExposure({
      totalValue: context.totalValue,
      stakingValue: context.stakingValue,
      liquidityValue: context.liquidityPositions.reduce((sum, item) => sum + item.value, 0),
      borrowValue: context.lendingPosition?.borrowValue || 0,
      governanceValue: context.governanceValue,
    }),
    resilienceInsight:
      volatilityRisk.stablecoinRatio >= 18
        ? "Portfolio resilience is supported by a healthy stable reserve."
        : "Portfolio resilience would improve with more stable reserve coverage.",
    trendDirection: trendDirection(trendDelta),
    trendDelta: round(trendDelta, 2),
    whatChangedThisWeek:
      Math.abs(trendDelta) >= 4
        ? `${trendDelta > 0 ? "Risk increased" : "Risk improved"} by ${round(Math.abs(trendDelta), 2)} points over the recent snapshot window.`
        : "Risk has remained relatively stable across the recent snapshot window.",
    recommendations,
    events: buildRiskEvents(context.transactionMirrors, context.snapshots, {
      borrowRisk,
      liquidityRisk,
    }),
  };
}

export async function getRiskSummary(userId, walletAddress) {
  const context = await buildRiskContext(userId, walletAddress);
  const dataset = buildRiskDataset(context);

  return {
    walletAddress: context.walletAddress,
    totalRiskScore: dataset.totalRiskScore,
    riskLabel: dataset.riskLabel,
    explanationSummary: dataset.explanationSummary,
    majorContributor: dataset.majorContributor,
    trendDirection: dataset.trendDirection,
    whatChangedThisWeek: dataset.whatChangedThisWeek,
    resilienceInsight: dataset.resilienceInsight,
    thresholds: dataset.thresholds,
    categoryScores: dataset.categoryScores,
    borrowMetrics: {
      healthFactor: dataset.borrowRisk.healthFactor,
      debtToCollateralRatio: dataset.borrowRisk.debtToCollateralRatio,
      liquidationWarningLevel: dataset.borrowRisk.liquidationWarningLevel,
    },
    protocolExposure: dataset.protocolExposure,
    source: "mirror+market+positions",
  };
}

export async function getRiskBreakdown(userId, walletAddress) {
  const context = await buildRiskContext(userId, walletAddress);
  const dataset = buildRiskDataset(context);

  return {
    walletAddress: context.walletAddress,
    totalRiskScore: dataset.totalRiskScore,
    riskLabel: dataset.riskLabel,
    categories: [
      { key: "volatility", label: "Volatility Risk", score: dataset.volatilityRisk.score },
      { key: "borrow", label: "Borrow Risk", score: dataset.borrowRisk.score },
      { key: "liquidity", label: "Liquidity Risk", score: dataset.liquidityRisk.score },
      { key: "concentration", label: "Concentration Risk", score: dataset.concentrationRisk.score },
    ],
    volatility: dataset.volatilityRisk,
    borrow: dataset.borrowRisk,
    liquidity: dataset.liquidityRisk,
    concentration: dataset.concentrationRisk,
    protocolExposure: dataset.protocolExposure,
    source: "mirror+market+positions",
  };
}

export async function getRiskTrend(userId, walletAddress, range = "30D") {
  const context = await buildRiskContext(userId, walletAddress);
  const dataset = buildRiskDataset(context);
  const series = buildTrendSeries({
    range,
    snapshots: context.snapshots,
    currentBorrowRisk: dataset.borrowRisk.score,
    currentLiquidityRisk: dataset.liquidityRisk.score,
    marketMap: context.marketMap,
    totalVisibleValue: context.totalVisibleValue,
  });
  const delta = series.length >= 2 ? series[series.length - 1].totalRiskScore - series[0].totalRiskScore : 0;

  return {
    walletAddress: context.walletAddress,
    range,
    trendDirection: trendDirection(delta),
    whatChangedThisWeek:
      Math.abs(delta) >= 4
        ? `${delta > 0 ? "Risk increased" : "Risk improved"} by ${round(Math.abs(delta), 2)} points over the selected range.`
        : "No major risk regime change detected across the selected range.",
    series,
    eventMarkers: dataset.events.slice(0, 6).map((event) => ({
      id: event.id,
      label: event.description,
      severity: event.severity,
      date: event.createdAt,
    })),
    source: "mirror+snapshots",
  };
}

export async function stressTestPortfolioRisk(userId, payload) {
  const context = await buildRiskContext(userId, payload.walletAddress);
  const dataset = buildRiskDataset(context);
  const scenario = STRESS_SCENARIOS[payload.scenario] || STRESS_SCENARIOS["sol-drop-10"];

  const baseline = {
    totalRiskScore: dataset.totalRiskScore,
    riskLabel: dataset.riskLabel,
    healthFactor: dataset.borrowRisk.healthFactor,
    projectedPortfolioValue: round(context.totalValue, 2),
    categoryScores: dataset.categoryScores,
  };

  const resultCategoryScores = {
    volatility: clamp(round(dataset.volatilityRisk.score * scenario.volatilityMultiplier, 2), 0, 100),
    borrow: clamp(round(dataset.borrowRisk.score + scenario.borrowDelta, 2), 0, 100),
    liquidity: clamp(round(dataset.liquidityRisk.score + scenario.liquidityDelta, 2), 0, 100),
    concentration: clamp(round(dataset.concentrationRisk.score + scenario.concentrationDelta, 2), 0, 100),
  };
  const totalRiskScore = clamp(
    round(
      resultCategoryScores.volatility * RISK_WEIGHTS.volatility +
        resultCategoryScores.borrow * RISK_WEIGHTS.borrow +
        resultCategoryScores.liquidity * RISK_WEIGHTS.liquidity +
        resultCategoryScores.concentration * RISK_WEIGHTS.concentration,
      2,
    ),
    0,
    100,
  );
  const healthFactor = dataset.borrowRisk.healthFactor
    ? round(
        dataset.borrowRisk.healthFactor *
          (scenario.key === "borrowed-asset-up-10" ? 0.88 : scenario.key.startsWith("sol-drop") ? 0.92 : 1.05),
        2,
      )
    : null;

  return {
    walletAddress: context.walletAddress,
    scenario: {
      key: scenario.key,
      label: scenario.label,
      description: scenario.description,
    },
    baseline,
    result: {
      totalRiskScore,
      riskLabel: riskLabel(totalRiskScore),
      projectedPortfolioValue: round(context.totalValue * (1 + scenario.totalValueImpactPercent / 100), 2),
      pnlImpactPercent: round(scenario.totalValueImpactPercent, 2),
      healthFactor,
      categoryScores: resultCategoryScores,
    },
    source: "scenario-simulation",
  };
}

export async function getRiskEvents(userId, walletAddress) {
  const context = await buildRiskContext(userId, walletAddress);
  const dataset = buildRiskDataset(context);

  return {
    walletAddress: context.walletAddress,
    events: dataset.events,
    source: "mirror+snapshots",
  };
}

export async function getRiskRecommendations(userId, walletAddress) {
  const context = await buildRiskContext(userId, walletAddress);
  const dataset = buildRiskDataset(context);

  return {
    walletAddress: context.walletAddress,
    recommendations: dataset.recommendations,
    majorContributor: dataset.majorContributor,
    resilienceInsight: dataset.resilienceInsight,
    source: "rule-engine",
  };
}
