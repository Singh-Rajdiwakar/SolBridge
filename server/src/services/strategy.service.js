import { AdminSetting } from "../models/AdminSetting.js";
import { LendingMarket } from "../models/LendingMarket.js";
import { LockPeriod } from "../models/LockPeriod.js";
import { MarketPriceSnapshot } from "../models/MarketPriceSnapshot.js";
import { Pool } from "../models/Pool.js";
import { StrategyPlan } from "../models/StrategyPlan.js";
import { Token } from "../models/Token.js";
import { AppError } from "../utils/app-error.js";

const PERIOD_DAYS = {
  "30D": 30,
  "90D": 90,
  "180D": 180,
  "1Y": 365,
};

const STRATEGY_BUCKETS = [
  {
    key: "staking",
    label: "Staking",
    yieldMetric: "stakingApy",
    riskWeight: 34,
    volatilityWeight: 42,
    rewardToken: "SOL",
    description: "Locked staking capital generating protocol rewards.",
  },
  {
    key: "liquidity",
    label: "Liquidity Pools",
    yieldMetric: "liquidityApr",
    riskWeight: 72,
    volatilityWeight: 76,
    rewardToken: "USDC",
    description: "LP allocation with fee generation and impermanent loss risk.",
  },
  {
    key: "lending",
    label: "Lending",
    yieldMetric: "lendingSupplyApr",
    riskWeight: 44,
    volatilityWeight: 28,
    rewardToken: "USDC",
    description: "Supply-side yield through lending markets.",
  },
  {
    key: "hold",
    label: "Hold / Idle",
    yieldMetric: "holdAppreciation",
    riskWeight: 51,
    volatilityWeight: 58,
    rewardToken: "SOL",
    description: "Idle spot allocation with optional appreciation assumptions.",
  },
  {
    key: "governance",
    label: "Governance Hold",
    yieldMetric: "governanceYield",
    riskWeight: 57,
    volatilityWeight: 48,
    rewardToken: "GOV",
    description: "Governance-token exposure with participation upside.",
  },
  {
    key: "stableReserve",
    label: "Stable Reserve",
    yieldMetric: "stableReserveYield",
    riskWeight: 12,
    volatilityWeight: 14,
    rewardToken: "USDC",
    description: "Defensive stablecoin reserve lowering overall portfolio stress.",
  },
];

const SCENARIO_PROFILES = {
  optimistic: {
    yieldMultiplier: 1.14,
    volatilityMultiplier: 0.88,
    riskAdjustment: -4,
    holdAdjustment: 4.5,
  },
  base: {
    yieldMultiplier: 1,
    volatilityMultiplier: 1,
    riskAdjustment: 0,
    holdAdjustment: 0,
  },
  conservative: {
    yieldMultiplier: 0.82,
    volatilityMultiplier: 1.14,
    riskAdjustment: 7,
    holdAdjustment: -3.2,
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function totalAllocation(allocations) {
  return round(
    Object.values(allocations || {}).reduce((sum, value) => sum + Number(value || 0), 0),
    2,
  );
}

function getRiskLabel(score) {
  if (score <= 30) return "Conservative";
  if (score <= 55) return "Balanced";
  if (score <= 78) return "Aggressive";
  return "High Risk";
}

function getVolatilityLabel(score) {
  if (score <= 24) return "Low";
  if (score <= 45) return "Moderate";
  if (score <= 68) return "Elevated";
  return "High";
}

function getStrategyNameSlug(name) {
  return name.trim().toLowerCase();
}

async function ensureUniqueStrategyName(userId, name, excludedId) {
  const existing = await StrategyPlan.findOne({
    userId,
    ...(excludedId ? { _id: { $ne: excludedId } } : {}),
  }).lean();

  if (!existing) {
    return;
  }

  const taken = await StrategyPlan.findOne({
    userId,
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    ...(excludedId ? { _id: { $ne: excludedId } } : {}),
  }).lean();

  if (taken) {
    throw new AppError("Strategy name already exists for this user.", 409);
  }
}

async function loadStrategyMetrics() {
  const [adminSetting, lockPeriods, pools, lendingMarkets, marketSnapshots, tokens] = await Promise.all([
    AdminSetting.findOne().sort({ updatedAt: -1 }).lean(),
    LockPeriod.find({ enabled: true }).lean(),
    Pool.find().lean(),
    LendingMarket.find().lean(),
    MarketPriceSnapshot.find({ symbol: { $in: ["SOL", "BTC", "ETH"] } }).sort({ fetchedAt: -1 }).lean(),
    Token.find({ symbol: { $in: ["SOL", "USDC", "GOV"] } }).lean(),
  ]);

  const enabledLockPeriods = lockPeriods.length ? lockPeriods : [{ apy: adminSetting?.rewardRate || 12.5 }];
  const stakingApy =
    enabledLockPeriods.reduce((sum, item) => sum + Number(item.apy || 0), 0) /
      Math.max(enabledLockPeriods.length, 1) || 12.5;
  const liquidityApr =
    pools.reduce((sum, pool) => sum + Number(pool.apr || 0), 0) / Math.max(pools.length, 1) || 18;

  const lendingWeight = lendingMarkets.reduce((sum, market) => sum + Number(market.totalSupplied || 0), 0);
  const lendingSupplyApr =
    lendingMarkets.reduce((sum, market) => sum + Number(market.supplyApr || 0) * Number(market.totalSupplied || 1), 0) /
      Math.max(lendingWeight || lendingMarkets.length, 1) || 7.4;
  const stableMarkets = lendingMarkets.filter((market) => ["USDC", "USDT", "DAI"].includes(market.token));
  const stableReserveYield =
    stableMarkets.reduce((sum, market) => sum + Number(market.supplyApr || 0), 0) /
      Math.max(stableMarkets.length, 1) || 2.1;
  const governanceYield = clamp(1.8 + pools.length * 0.25 + enabledLockPeriods.length * 0.2, 2, 5.5);

  const latestBySymbol = new Map();
  for (const snapshot of marketSnapshots) {
    if (!latestBySymbol.has(snapshot.symbol)) {
      latestBySymbol.set(snapshot.symbol, snapshot);
    }
  }
  const tokenMap = new Map(tokens.map((token) => [token.symbol, token]));

  return {
    stakingApy: round(stakingApy, 2),
    liquidityApr: round(liquidityApr, 2),
    lendingSupplyApr: round(lendingSupplyApr, 2),
    governanceYield: round(governanceYield, 2),
    stableReserveYield: round(stableReserveYield * 0.35, 2),
    holdAppreciation: 0,
    solPrice: latestBySymbol.get("SOL")?.price || tokenMap.get("SOL")?.price || 152.4,
    stablePrice: 1,
    governanceTokenPrice: tokenMap.get("GOV")?.price || 2.8,
  };
}

function getBucketBaseYield(bucket, metrics, scenario) {
  const profile = SCENARIO_PROFILES[scenario];
  if (bucket.key === "hold") {
    return round(metrics.holdAppreciation + profile.holdAdjustment, 2);
  }
  if (bucket.key === "stableReserve") {
    return round(metrics.stableReserveYield * (scenario === "conservative" ? 0.94 : 1), 2);
  }
  return round(metrics[bucket.yieldMetric] * profile.yieldMultiplier, 2);
}

function getBucketTokenPrice(bucket, metrics) {
  if (bucket.rewardToken === "SOL") {
    return metrics.solPrice;
  }
  if (bucket.rewardToken === "GOV") {
    return metrics.governanceTokenPrice;
  }
  return metrics.stablePrice;
}

function getBucketRiskContribution(bucket, allocationPercent) {
  return (allocationPercent / 100) * bucket.riskWeight;
}

function getBucketVolatilityContribution(bucket, allocationPercent, scenario) {
  return (allocationPercent / 100) * bucket.volatilityWeight * SCENARIO_PROFILES[scenario].volatilityMultiplier;
}

function buildGrowthSeries(portfolioCapital, annualYieldUsd, days, annualYieldPercent) {
  const steps = days <= 30 ? 6 : days <= 90 ? 7 : 8;
  return Array.from({ length: steps }, (_, index) => {
    const fraction = (index + 1) / steps;
    const elapsedDays = Math.round(days * fraction);
    const projectedReward = annualYieldUsd * (elapsedDays / 365);
    return {
      label:
        days <= 30
          ? `D${elapsedDays}`
          : days <= 180
            ? `M${Math.max(1, Math.round(elapsedDays / 30))}`
            : `Q${Math.max(1, Math.round(elapsedDays / 91))}`,
      value: round(portfolioCapital + projectedReward, 2),
      reward: round(projectedReward, 2),
      annualizedReturn: round(annualYieldPercent * fraction, 2),
    };
  });
}

function buildStressTests(simulation) {
  const { portfolioCapital, projectedTotalValue, annualYieldPercent, riskScore, allocations } = simulation;
  const tests = [
    {
      key: "sol-drop",
      label: "SOL drops 10%",
      description: "Volatile asset buckets absorb downside quickly when base assets retrace.",
      drawdownPercent: round(
        allocations.staking * 0.08 +
          allocations.liquidity * 0.1 +
          allocations.hold * 0.07 +
          allocations.governance * 0.05,
        2,
      ),
      yieldDelta: -1.8,
      riskDelta: 8,
    },
    {
      key: "lp-divergence",
      label: "Liquidity pair diverges 20%",
      description: "Impermanent loss pressure hits LP-heavy strategies first.",
      drawdownPercent: round(allocations.liquidity * 0.19, 2),
      yieldDelta: -3.4,
      riskDelta: 10,
    },
    {
      key: "yield-compression",
      label: "Protocol yields compress",
      description: "Staking, LP, and lending rates tighten across the stack.",
      drawdownPercent: round(allocations.staking * 0.02 + allocations.lending * 0.015 + allocations.liquidity * 0.03, 2),
      yieldDelta: -annualYieldPercent * 0.18,
      riskDelta: 4,
    },
    {
      key: "stable-buffer",
      label: "Stable reserve absorbs volatility",
      description: "Cash buffer improves downside control and smooths portfolio variance.",
      drawdownPercent: round(Math.max(0, 4.2 - allocations.stableReserve * 0.18), 2),
      yieldDelta: -0.6,
      riskDelta: -6,
    },
  ];

  return tests.map((test) => {
    const updatedRisk = clamp(round(riskScore + test.riskDelta, 1), 0, 100);
    const updatedYield = round(Math.max(-12, annualYieldPercent + test.yieldDelta), 2);
    const updatedProjectedValue = round(
      projectedTotalValue - portfolioCapital * (test.drawdownPercent / 100),
      2,
    );

    return {
      ...test,
      updatedRiskScore: updatedRisk,
      updatedRiskLabel: getRiskLabel(updatedRisk),
      updatedAnnualYieldPercent: updatedYield,
      updatedProjectedValue,
    };
  });
}

function buildStrategySimulation(strategyInput, metrics) {
  const portfolioCapital = Number(strategyInput.portfolioCapital || 0);
  const allocations = {
    staking: Number(strategyInput.allocations.staking || 0),
    liquidity: Number(strategyInput.allocations.liquidity || 0),
    lending: Number(strategyInput.allocations.lending || 0),
    hold: Number(strategyInput.allocations.hold || 0),
    governance: Number(strategyInput.allocations.governance || 0),
    stableReserve: Number(strategyInput.allocations.stableReserve || 0),
  };

  const total = totalAllocation(allocations);
  if (total !== 100) {
    throw new AppError("Strategy allocations must total 100%.", 400);
  }

  const timeframe = strategyInput.timeframe || "1Y";
  const scenario = strategyInput.scenario || "base";
  const days = PERIOD_DAYS[timeframe];

  const bucketBreakdown = STRATEGY_BUCKETS.map((bucket) => {
    const allocationPercent = allocations[bucket.key];
    const capitalAllocated = round((portfolioCapital * allocationPercent) / 100, 2);
    const annualYieldRate = getBucketBaseYield(bucket, metrics, scenario);
    const annualRewardUsd = round((capitalAllocated * annualYieldRate) / 100, 2);
    const periodRewardUsd = round((annualRewardUsd * days) / 365, 2);
    const tokenPrice = getBucketTokenPrice(bucket, metrics);

    return {
      bucket: bucket.key,
      label: bucket.label,
      allocationPercent,
      capitalAllocated,
      annualYieldRate,
      annualRewardUsd,
      periodRewardUsd,
      rewardToken: bucket.rewardToken,
      rewardEstimateTokens: tokenPrice ? round(periodRewardUsd / tokenPrice, 4) : 0,
      riskContribution: round(getBucketRiskContribution(bucket, allocationPercent), 2),
      volatilityContribution: round(getBucketVolatilityContribution(bucket, allocationPercent, scenario), 2),
      description: bucket.description,
    };
  });

  const annualYieldUsd = round(bucketBreakdown.reduce((sum, bucket) => sum + bucket.annualRewardUsd, 0), 2);
  const periodYieldUsd = round(bucketBreakdown.reduce((sum, bucket) => sum + bucket.periodRewardUsd, 0), 2);
  const annualYieldPercent = round((annualYieldUsd / Math.max(portfolioCapital, 1)) * 100, 2);
  const projectedTotalValue = round(portfolioCapital + periodYieldUsd, 2);

  const highestAllocation = Math.max(...Object.values(allocations));
  const highExposurePenalty = highestAllocation > 45 ? (highestAllocation - 45) * 0.7 : 0;
  const lowStablePenalty = allocations.stableReserve < 10 ? (10 - allocations.stableReserve) * 0.9 : 0;
  const liquidityPenalty = allocations.liquidity > 25 ? (allocations.liquidity - 25) * 0.35 : 0;
  const lendingPenalty = allocations.lending > 25 ? (allocations.lending - 25) * 0.3 : 0;
  const protocolDependencyPenalty =
    allocations.staking + allocations.liquidity + allocations.lending + allocations.governance > 80 ? 6 : 0;

  const riskScore = clamp(
    round(
      bucketBreakdown.reduce((sum, bucket) => sum + bucket.riskContribution, 0) +
        highExposurePenalty +
        lowStablePenalty +
        liquidityPenalty +
        lendingPenalty +
        protocolDependencyPenalty +
        SCENARIO_PROFILES[scenario].riskAdjustment,
      1,
    ),
    4,
    96,
  );

  const volatilityScore = clamp(
    round(
      bucketBreakdown.reduce((sum, bucket) => sum + bucket.volatilityContribution, 0) -
        allocations.stableReserve * 0.22 +
        (allocations.hold > 35 ? 4 : 0),
      1,
    ),
    6,
    94,
  );

  const topYieldBucket = bucketBreakdown.slice().sort((a, b) => b.periodRewardUsd - a.periodRewardUsd)[0];
  const topRiskBucket = bucketBreakdown.slice().sort((a, b) => b.riskContribution - a.riskContribution)[0];
  const stableCoverage = allocations.stableReserve;
  const diversificationScore = clamp(
    round(72 - highExposurePenalty - Math.max(0, 12 - stableCoverage) * 1.2 + Object.values(allocations).filter((value) => value > 0).length * 3, 1),
    18,
    96,
  );

  const scenarioOutlook = {
    bestCase: round(projectedTotalValue * (1 + volatilityScore / 900), 2),
    baseCase: projectedTotalValue,
    adverseCase: round(projectedTotalValue * (1 - volatilityScore / 700), 2),
  };

  return {
    name: strategyInput.name || "Draft Strategy",
    timeframe,
    scenario,
    portfolioCapital: round(portfolioCapital, 2),
    allocations,
    assumptions: {
      stakingApy: metrics.stakingApy,
      liquidityApr: metrics.liquidityApr,
      lendingSupplyApr: metrics.lendingSupplyApr,
      governanceYield: metrics.governanceYield,
      stableReserveYield: metrics.stableReserveYield,
      holdAppreciation: getBucketBaseYield({ key: "hold", yieldMetric: "holdAppreciation" }, metrics, scenario),
    },
    expectedYield: {
      dailyUsd: round(annualYieldUsd / 365, 2),
      monthlyUsd: round(annualYieldUsd / 12, 2),
      annualUsd: annualYieldUsd,
      dailyPercent: round(annualYieldPercent / 365, 4),
      monthlyPercent: round(annualYieldPercent / 12, 2),
      annualPercent: annualYieldPercent,
      projectedTotalValue,
    },
    rewardEstimate: {
      period: timeframe,
      periodDays: days,
      totalUsd: periodYieldUsd,
      totalTokensEquivalent: round(bucketBreakdown.reduce((sum, bucket) => sum + bucket.rewardEstimateTokens, 0), 4),
      byBucket: bucketBreakdown.map((bucket) => ({
        bucket: bucket.bucket,
        label: bucket.label,
        rewardUsd: bucket.periodRewardUsd,
        rewardToken: bucket.rewardToken,
        rewardTokens: bucket.rewardEstimateTokens,
        contributionPercent: periodYieldUsd ? round((bucket.periodRewardUsd / periodYieldUsd) * 100, 2) : 0,
      })),
    },
    risk: {
      score: riskScore,
      label: getRiskLabel(riskScore),
      explanation:
        topRiskBucket.allocationPercent > 0
          ? `${topRiskBucket.label} is the strongest risk contributor at ${topRiskBucket.allocationPercent}% allocation.`
          : "Risk remains muted with a defensive reserve posture.",
      stableReserveBuffer: stableCoverage,
    },
    volatility: {
      score: volatilityScore,
      label: getVolatilityLabel(volatilityScore),
      range: {
        bestCase: round(Math.max(0.8, volatilityScore * 0.72), 2),
        baseCase: round(volatilityScore, 2),
        adverseCase: round(volatilityScore * 1.28, 2),
      },
      scenarioOutlook,
    },
    exposureBreakdown: [
      { key: "staking", label: "Staking", value: allocations.staking },
      { key: "liquidity", label: "Liquidity", value: allocations.liquidity },
      { key: "lending", label: "Lending", value: allocations.lending },
      { key: "hold", label: "Spot Hold", value: allocations.hold },
      { key: "governance", label: "Governance", value: allocations.governance },
      { key: "stableReserve", label: "Stable Reserve", value: allocations.stableReserve },
    ],
    allocationBreakdown: bucketBreakdown.map((bucket) => ({
      key: bucket.bucket,
      label: bucket.label,
      value: bucket.allocationPercent,
      capitalAllocated: bucket.capitalAllocated,
      annualYieldRate: bucket.annualYieldRate,
      annualRewardUsd: bucket.annualRewardUsd,
    })),
    growthSeries: buildGrowthSeries(portfolioCapital, annualYieldUsd, days, annualYieldPercent),
    bucketMetrics: bucketBreakdown,
    explainability: {
      highestYieldBucket: topYieldBucket.label,
      highestRiskBucket: topRiskBucket.label,
      balanceProfile:
        riskScore <= 35 ? "Capital Preservation" : riskScore <= 58 ? "Balanced Profile" : "High Yield Tilt",
      notes: [
        `${topYieldBucket.label} contributes the most return to this mix.`,
        stableCoverage < 12
          ? "Stable reserve is light, which weakens downside protection."
          : "Stable reserve improves downside buffering.",
      ],
      diversityScore: diversificationScore,
    },
    stressTests: buildStressTests({
      portfolioCapital,
      projectedTotalValue,
      annualYieldPercent,
      riskScore,
      allocations,
    }),
    source: "protocol-metrics+rules",
  };
}

function sanitizeStrategyPlan(plan) {
  return {
    _id: plan._id,
    name: plan.name,
    allocations: plan.allocations,
    portfolioCapital: plan.portfolioCapital,
    timeframe: plan.timeframe,
    scenario: plan.scenario,
    assumptions: plan.assumptions || {},
    notes: plan.notes || "",
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

async function getStrategyForUser(userId, strategyId) {
  const strategy = await StrategyPlan.findOne({ _id: strategyId, userId });
  if (!strategy) {
    throw new AppError("Strategy not found", 404);
  }
  return strategy;
}

export async function listStrategies(userId) {
  const strategies = await StrategyPlan.find({ userId }).sort({ updatedAt: -1, createdAt: -1 }).lean();
  return strategies.map((strategy) => ({
    ...sanitizeStrategyPlan(strategy),
    allocationTotal: totalAllocation(strategy.allocations),
  }));
}

export async function createStrategy(userId, payload) {
  await ensureUniqueStrategyName(userId, payload.name);
  const strategy = await StrategyPlan.create({
    userId,
    ...payload,
  });
  return sanitizeStrategyPlan(strategy);
}

export async function updateStrategy(userId, strategyId, payload) {
  const strategy = await getStrategyForUser(userId, strategyId);

  if (payload.name && getStrategyNameSlug(payload.name) !== getStrategyNameSlug(strategy.name)) {
    await ensureUniqueStrategyName(userId, payload.name, strategyId);
  }

  Object.assign(strategy, payload);
  await strategy.save();
  return sanitizeStrategyPlan(strategy);
}

export async function deleteStrategy(userId, strategyId) {
  const strategy = await getStrategyForUser(userId, strategyId);
  await strategy.deleteOne();
  return { id: strategyId, deleted: true };
}

export async function simulateStrategy(userId, payload) {
  const metrics = await loadStrategyMetrics();
  return {
    ...buildStrategySimulation(payload, metrics),
    userId,
  };
}

function calculateBalanceIndex(simulation) {
  const yieldScore = simulation.expectedYield.annualPercent;
  const riskScore = simulation.risk.score;
  const volatilityScore = simulation.volatility.score;
  const diversityScore = simulation.explainability.diversityScore;
  return Math.abs(yieldScore - 12) + riskScore * 0.45 + volatilityScore * 0.25 - diversityScore * 0.12;
}

export async function compareStrategies(userId, payload) {
  const metrics = await loadStrategyMetrics();
  const savedStrategies = payload.strategyIds?.length
    ? await StrategyPlan.find({ userId, _id: { $in: payload.strategyIds } }).lean()
    : [];

  const inlineStrategies = payload.strategies || [];
  const simulations = [
    ...savedStrategies.map((strategy) =>
      buildStrategySimulation(
        {
          name: strategy.name,
          allocations: strategy.allocations,
          portfolioCapital: strategy.portfolioCapital,
          timeframe: strategy.timeframe,
          scenario: strategy.scenario,
          assumptions: strategy.assumptions,
          notes: strategy.notes,
        },
        metrics,
      ),
    ),
    ...inlineStrategies.map((strategy, index) =>
      buildStrategySimulation(
        {
          ...strategy,
          name: strategy.name || `Draft Strategy ${index + 1}`,
        },
        metrics,
      ),
    ),
  ];

  if (simulations.length < 2) {
    throw new AppError("Compare at least two strategies.", 400);
  }

  const bestYield = simulations.slice().sort((a, b) => b.expectedYield.annualPercent - a.expectedYield.annualPercent)[0];
  const lowestRisk = simulations.slice().sort((a, b) => a.risk.score - b.risk.score)[0];
  const balanced = simulations.slice().sort((a, b) => calculateBalanceIndex(a) - calculateBalanceIndex(b))[0];

  return {
    strategies: simulations.map((simulation) => ({
      name: simulation.name,
      timeframe: simulation.timeframe,
      scenario: simulation.scenario,
      annualYieldPercent: simulation.expectedYield.annualPercent,
      annualYieldUsd: simulation.expectedYield.annualUsd,
      projectedTotalValue: simulation.expectedYield.projectedTotalValue,
      riskScore: simulation.risk.score,
      riskLabel: simulation.risk.label,
      volatilityScore: simulation.volatility.score,
      volatilityLabel: simulation.volatility.label,
      balanceProfile: simulation.explainability.balanceProfile,
      allocations: simulation.allocations,
    })),
    highlights: {
      bestYield: bestYield.name,
      lowestRisk: lowestRisk.name,
      balancedProfile: balanced.name,
    },
    source: "strategy-simulation",
  };
}
