import { AIAdvice } from "../models/AIAdvice.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { getPortfolioAdvice } from "./portfolio-ai.service.js";
import { getRiskBreakdown, getRiskRecommendations, getRiskSummary } from "./risk.service.js";
import { simulateStrategy } from "./strategy.service.js";
import { getWalletInsightsSummary, getWalletPortfolio } from "./wallet.service.js";

const STABLECOINS = new Set(["USDC", "USDT", "DAI", "USDS", "PYUSD"]);
const GOVERNANCE_SYMBOLS = new Set(["GOV", "RTX"]);
const DISCLAIMER =
  "Informational insights only. Suggestions are derived from current on-chain, mirrored, and cached market data and are not financial advice.";

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function portfolioHealthLabel(score) {
  if (score <= 35) return "Low Risk";
  if (score <= 65) return "Moderate Risk";
  if (score <= 85) return "High Risk";
  return "Critical Risk";
}

function diversificationLabel(score) {
  if (score >= 78) return "Well diversified";
  if (score >= 56) return "Moderately diversified";
  return "Needs improvement";
}

function severityFromScore(score) {
  if (score >= 80) return "high-risk";
  if (score >= 60) return "warning";
  if (score >= 35) return "caution";
  return "info";
}

function buildAction(label, href, intent = "review") {
  return { label, href, intent };
}

function buildInsight({
  id,
  category,
  title,
  message,
  severity = "info",
  confidence = 72,
  action,
  why,
  trigger,
  impact,
}) {
  const relevanceScore = clamp(round(confidence, 0), 40, 99);
  return {
    id,
    category,
    title,
    message,
    severity,
    confidence: relevanceScore,
    relevance: relevanceScore >= 82 ? "High" : relevanceScore >= 65 ? "Medium" : "Normal",
    action,
    why,
    trigger,
    impact,
  };
}

async function ensureAccessibleWallet(userId, requestedWalletAddress) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const walletAddress = requestedWalletAddress || user.walletAddress;
  const allowed = new Set([
    user.walletAddress,
    ...(user.linkedWallets || []).map((wallet) => wallet.address),
  ]);

  if (!walletAddress || !allowed.has(walletAddress)) {
    throw new AppError("Wallet is not linked to this user.", 403);
  }

  return { walletAddress };
}

function normalizeAllocations(allocations) {
  const cleaned = {
    staking: Math.max(0, round(allocations.staking || 0, 2)),
    liquidity: Math.max(0, round(allocations.liquidity || 0, 2)),
    lending: Math.max(0, round(allocations.lending || 0, 2)),
    hold: Math.max(0, round(allocations.hold || 0, 2)),
    governance: Math.max(0, round(allocations.governance || 0, 2)),
    stableReserve: Math.max(0, round(allocations.stableReserve || 0, 2)),
  };
  const total = Object.values(cleaned).reduce((sum, value) => sum + value, 0);
  if (!total) {
    return {
      staking: 0,
      liquidity: 0,
      lending: 0,
      hold: 100,
      governance: 0,
      stableReserve: 0,
    };
  }

  const normalized = Object.fromEntries(
    Object.entries(cleaned).map(([key, value]) => [key, round((value / total) * 100, 2)]),
  );
  const normalizedTotal = Object.values(normalized).reduce((sum, value) => sum + value, 0);
  normalized.hold = round(normalized.hold + (100 - normalizedTotal), 2);
  return normalized;
}

function shiftAllocation(allocations, fromKey, toKey, requestedAmount) {
  const amount = Math.min(Math.max(0, requestedAmount), allocations[fromKey] || 0);
  if (amount <= 0) {
    return 0;
  }

  allocations[fromKey] = round((allocations[fromKey] || 0) - amount, 2);
  allocations[toKey] = round((allocations[toKey] || 0) + amount, 2);
  return amount;
}

function deriveStrategyAllocations(portfolio, riskSummary) {
  const totalValue = Math.max(portfolio.totalPortfolioUsd || 0, 1);
  const stableReserveShare = round(
    (portfolio.tokens || [])
      .filter((token) => STABLECOINS.has(token.symbol))
      .reduce((sum, token) => sum + token.usdValue, 0) / totalValue * 100,
    2,
  );
  const governanceShare = round(
    (portfolio.tokens || [])
      .filter((token) => GOVERNANCE_SYMBOLS.has(token.symbol))
      .reduce((sum, token) => sum + token.usdValue, 0) / totalValue * 100,
    2,
  );
  const exposureMap = Object.fromEntries(
    (riskSummary.protocolExposure || []).map((item) => [item.key, Number(item.percentage || 0)]),
  );
  const remainingSpot = Math.max(
    0,
    100 - (exposureMap.staking || 0) - (exposureMap.liquidity || 0) - (exposureMap.lending || 0),
  );
  const stableSlice = Math.min(stableReserveShare, remainingSpot);
  const governanceSlice = Math.min(governanceShare, Math.max(0, remainingSpot - stableSlice));
  const hold = Math.max(0, remainingSpot - stableSlice - governanceSlice);

  return normalizeAllocations({
    staking: exposureMap.staking || 0,
    liquidity: exposureMap.liquidity || 0,
    lending: exposureMap.lending || 0,
    hold,
    governance: governanceSlice,
    stableReserve: stableSlice,
  });
}

function buildTargetAllocations(currentAllocations, aiAdvice, riskBreakdown) {
  const target = { ...currentAllocations };
  const stableGap = Math.max(0, 12 - target.stableReserve);
  if (stableGap > 0) {
    shiftAllocation(target, target.hold >= stableGap ? "hold" : "liquidity", "stableReserve", stableGap);
  }

  if (Number(aiAdvice.dominantAllocation || 0) >= 58) {
    const primarySource = target.hold >= 10 ? "hold" : target.liquidity >= 8 ? "liquidity" : "governance";
    const moved = shiftAllocation(target, primarySource, "staking", Math.min(10, Math.max(6, target[primarySource] * 0.25)));
    if (moved < 6) {
      shiftAllocation(target, "governance", "stableReserve", Math.min(4, target.governance));
    }
  }

  if (riskBreakdown.liquidity?.score >= 55 && target.liquidity > 18) {
    const shift = Math.min(10, target.liquidity - 18);
    shiftAllocation(target, "liquidity", "staking", shift * 0.6);
    shiftAllocation(target, "liquidity", "stableReserve", shift * 0.4);
  }

  if (riskBreakdown.borrow?.score >= 50) {
    shiftAllocation(target, target.hold >= 5 ? "hold" : "staking", "stableReserve", 5);
  }

  return normalizeAllocations(target);
}

function buildActionLinks() {
  return [
    buildAction("Open Staking", "/dashboard/stake", "yield"),
    buildAction("Review Risk Engine", "/dashboard/risk", "risk"),
    buildAction("Open Strategy Builder", "/dashboard/strategy", "rebalance"),
    buildAction("Inspect Borrow Position", "/dashboard/borrow", "borrow"),
    buildAction("View Wallet Allocation", "/dashboard/wallet", "wallet"),
  ];
}

function buildPortfolioInsights({ aiAdvice, riskBreakdown, riskSummary, walletInsights, currentSimulation }) {
  const items = [];

  items.push(
    buildInsight({
      id: "dominant-allocation",
      category: "allocation",
      title: `${aiAdvice.dominantAsset} remains the dominant allocation`,
      message: `${aiAdvice.dominantAsset} accounts for ${round(aiAdvice.dominantAllocation, 1)}% of visible wallet value.`,
      severity: aiAdvice.dominantAllocation >= 60 ? "warning" : "caution",
      confidence: Math.max(74, aiAdvice.confidence - 4),
      action: buildAction("Review token allocation", "/dashboard/wallet", "allocation"),
      why: "Single-asset dominance can raise portfolio drawdown sensitivity.",
      trigger: `${round(aiAdvice.dominantAllocation, 1)}% dominant allocation`,
      impact: "Higher concentration risk",
    }),
  );

  items.push(
    buildInsight({
      id: "stable-reserve",
      category: "diversification",
      title:
        aiAdvice.stablecoinShare < 12
          ? "Stable reserve coverage is light"
          : "Stable reserve is helping reduce volatility",
      message:
        aiAdvice.stablecoinShare < 12
          ? `Stablecoins represent only ${round(aiAdvice.stablecoinShare, 1)}% of the portfolio.`
          : `Stablecoins represent ${round(aiAdvice.stablecoinShare, 1)}% of visible wallet value.`,
      severity: aiAdvice.stablecoinShare < 12 ? "caution" : "info",
      confidence: aiAdvice.confidence,
      action: buildAction("Open Strategy Builder", "/dashboard/strategy", "resilience"),
      why: "Stable reserve size changes downside protection and rebalancing flexibility.",
      trigger: `${round(aiAdvice.stablecoinShare, 1)}% stablecoin share`,
      impact: aiAdvice.stablecoinShare < 12 ? "Lower resilience" : "Improved downside buffer",
    }),
  );

  if (riskBreakdown.liquidity?.portfolioInPoolsPercent > 0) {
    items.push(
      buildInsight({
        id: "lp-footprint",
        category: "protocol-exposure",
        title:
          riskBreakdown.liquidity.portfolioInPoolsPercent >= 20
            ? "Liquidity pool footprint is meaningful"
            : "Liquidity pool exposure is controlled",
        message: `${round(riskBreakdown.liquidity.portfolioInPoolsPercent, 1)}% of visible value is in liquidity positions.`,
        severity: riskBreakdown.liquidity.score >= 55 ? "warning" : "info",
        confidence: 82,
        action: buildAction("Inspect pools", "/dashboard/pools", "liquidity"),
        why: "LP allocation can improve yield but also adds impermanent loss sensitivity.",
        trigger: `${round(riskBreakdown.liquidity.portfolioInPoolsPercent, 1)}% LP share`,
        impact: riskBreakdown.liquidity.score >= 55 ? "Higher LP risk" : "Yield diversification",
      }),
    );
  }

  items.push(
    buildInsight({
      id: "yield-driver",
      category: "yield",
      title: `${currentSimulation.explainability.highestYieldBucket} is the strongest modeled yield source`,
      message: `${currentSimulation.explainability.highestYieldBucket} contributes the largest share of modeled return in the current allocation mix.`,
      severity: "info",
      confidence: 79,
      action: buildAction("Open strategy builder", "/dashboard/strategy", "yield"),
      why: "The strategy model compares bucket-level yield assumptions across staking, liquidity, lending, and reserves.",
      trigger: `${round(currentSimulation.expectedYield.annualPercent, 2)}% modeled annualized yield`,
      impact: "Primary return driver",
    }),
  );

  if (walletInsights.transactionCount > 0) {
    items.push(
      buildInsight({
        id: "activity-pattern",
        category: "activity",
        title: `${walletInsights.favoriteToken} is your most active wallet token`,
        message: `${walletInsights.transactionCount} mirrored wallet events suggest recurring activity around ${walletInsights.favoriteToken}.`,
        severity: walletInsights.activityScore >= 72 ? "info" : "caution",
        confidence: 70,
        action: buildAction("Review transactions", "/dashboard/wallet", "activity"),
        why: "Frequent token usage can signal operational focus and behavioral concentration.",
        trigger: `${walletInsights.favoriteToken} favorite token`,
        impact: riskSummary.majorContributor,
      }),
    );
  }

  return items;
}

function buildYieldSuggestions({ portfolio, currentSimulation, riskBreakdown, currentAllocations }) {
  const suggestions = [];
  const totalCapital = Number(portfolio.totalPortfolioUsd || 0);
  const stakingApy = Number(currentSimulation.assumptions.stakingApy || 0);
  const lendingApy = Number(currentSimulation.assumptions.lendingSupplyApr || 0);
  const liquidityApr = Number(currentSimulation.assumptions.liquidityApr || 0);

  if (currentAllocations.hold >= 14 && stakingApy > 0) {
    const movePercent = Math.min(15, round(Math.max(8, currentAllocations.hold * 0.35), 1));
    const projectedLift = round((totalCapital * (movePercent / 100) * stakingApy) / 100, 2);
    suggestions.push(
      buildInsight({
        id: "idle-to-staking",
        category: "yield",
        title: "Idle balance could be moved into staking",
        message: `${movePercent}% of current idle allocation redirected to staking could add roughly ${projectedLift} USD of annualized yield at current modeled APY.`,
        severity: "info",
        confidence: 88,
        action: buildAction("Open staking", "/dashboard/stake", "yield"),
        why: "Hold allocation is producing less yield than staking in the current rate environment.",
        trigger: `${round(currentAllocations.hold, 1)}% idle hold allocation`,
        impact: `Potential +${projectedLift} USD annualized yield`,
      }),
    );
  }

  if (currentAllocations.liquidity >= 18 && riskBreakdown.liquidity.score >= 45) {
    suggestions.push(
      buildInsight({
        id: "lp-efficiency",
        category: "yield",
        title: "Liquidity allocation is carrying more risk than efficiency",
        message: `LP exposure is ${round(currentAllocations.liquidity, 1)}% while impermanent loss pressure is rated ${riskBreakdown.liquidity.ilRiskLabel}.`,
        severity: riskBreakdown.liquidity.score >= 60 ? "warning" : "caution",
        confidence: 84,
        action: buildAction("Inspect pools", "/dashboard/pools", "lp"),
        why: "Current LP share is high relative to its risk-adjusted yield quality.",
        trigger: `${round(liquidityApr, 2)}% modeled liquidity APR`,
        impact: "Lower risk-adjusted yield",
      }),
    );
  }

  if (currentAllocations.lending > 0 && lendingApy + 1.5 < stakingApy) {
    suggestions.push(
      buildInsight({
        id: "lending-vs-staking",
        category: "yield",
        title: "Lending yield trails staking in the current environment",
        message: `Modeled lending supply yield is ${round(lendingApy, 2)}% versus ${round(stakingApy, 2)}% for staking assumptions.`,
        severity: "info",
        confidence: 76,
        action: buildAction("Open strategy builder", "/dashboard/strategy", "compare"),
        why: "Relative yield gap suggests a rebalance may improve efficiency without a large risk increase.",
        trigger: `${round(stakingApy - lendingApy, 2)}% yield gap`,
        impact: "Potential yield improvement",
      }),
    );
  }

  if (currentAllocations.stableReserve >= 22) {
    suggestions.push(
      buildInsight({
        id: "cash-drag",
        category: "yield",
        title: "Stable reserve may be creating cash drag",
        message: `Stable reserve is ${round(currentAllocations.stableReserve, 1)}% of the modeled allocation mix.`,
        severity: "info",
        confidence: 68,
        action: buildAction("Open strategy builder", "/dashboard/strategy", "rebalance"),
        why: "Higher cash buffers improve resilience but can weigh on overall yield efficiency.",
        trigger: `${round(currentAllocations.stableReserve, 1)}% stable reserve`,
        impact: "Lower expected yield",
      }),
    );
  }

  return suggestions;
}

function buildRiskWarnings({ riskSummary, riskBreakdown }) {
  const warnings = [];

  if (riskSummary.totalRiskScore >= 60) {
    warnings.push(
      buildInsight({
        id: "overall-risk",
        category: "risk",
        title: "Overall portfolio risk is elevated",
        message: `${riskSummary.totalRiskScore}/100 places the portfolio in the ${riskSummary.riskLabel.toLowerCase()} band.`,
        severity: severityFromScore(riskSummary.totalRiskScore),
        confidence: 90,
        action: buildAction("Review risk engine", "/dashboard/risk", "risk"),
        why: riskSummary.explanationSummary,
        trigger: `${riskSummary.totalRiskScore}/100 total risk score`,
        impact: "Reduced downside resilience",
      }),
    );
  }

  if (riskBreakdown.borrow?.score >= 45) {
    warnings.push(
      buildInsight({
        id: "borrow-warning",
        category: "risk",
        title: "Borrow exposure is nearing a sensitive zone",
        message: `Debt-to-collateral ratio is ${round(riskBreakdown.borrow.debtToCollateralRatio, 1)}% with health factor ${riskBreakdown.borrow.healthFactor ?? "n/a"}.`,
        severity: riskBreakdown.borrow.healthFactor && riskBreakdown.borrow.healthFactor < 1.5 ? "high-risk" : "warning",
        confidence: 89,
        action: buildAction("Inspect borrow position", "/dashboard/borrow", "borrow"),
        why: riskBreakdown.borrow.explanation,
        trigger: `${round(riskBreakdown.borrow.debtToCollateralRatio, 1)}% debt ratio`,
        impact: riskBreakdown.borrow.liquidationWarningLevel,
      }),
    );
  }

  if (riskBreakdown.concentration?.largestAssetPercent >= 55) {
    warnings.push(
      buildInsight({
        id: "concentration-warning",
        category: "risk",
        title: "Portfolio concentration is high",
        message: `${round(riskBreakdown.concentration.largestAssetPercent, 1)}% of value is tied to a single asset.`,
        severity: "warning",
        confidence: 87,
        action: buildAction("Review token allocation", "/dashboard/wallet", "diversify"),
        why: riskBreakdown.concentration.explanation,
        trigger: `${round(riskBreakdown.concentration.largestAssetPercent, 1)}% largest asset`,
        impact: "Higher single-asset drawdown risk",
      }),
    );
  }

  if (riskBreakdown.liquidity?.score >= 55) {
    warnings.push(
      buildInsight({
        id: "lp-risk-warning",
        category: "risk",
        title: "LP exposure may raise impermanent loss pressure",
        message: `${riskBreakdown.liquidity.ilRiskLabel} with ${round(riskBreakdown.liquidity.portfolioInPoolsPercent, 1)}% of value in pools.`,
        severity: "warning",
        confidence: 83,
        action: buildAction("Inspect pools", "/dashboard/pools", "lp"),
        why: riskBreakdown.liquidity.explanation,
        trigger: `${round(riskBreakdown.liquidity.estimatedImpermanentLossPressure, 1)} IL pressure`,
        impact: "Higher downside volatility in LP positions",
      }),
    );
  }

  return warnings;
}

function buildRebalancingSuggestions({ currentAllocations, currentSimulation, suggestedAllocations, suggestedSimulation }) {
  const labelMap = {
    staking: "Staking",
    liquidity: "Liquidity",
    lending: "Lending",
    hold: "Idle Hold",
    governance: "Governance",
    stableReserve: "Stable Reserve",
  };

  return Object.entries(suggestedAllocations)
    .map(([bucket, target]) => ({
      bucket,
      target: round(target, 2),
      current: round(currentAllocations[bucket] || 0, 2),
      delta: round((target || 0) - (currentAllocations[bucket] || 0), 2),
    }))
    .filter((entry) => Math.abs(entry.delta) >= 3)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4)
    .map((entry) => ({
      id: `rebalance-${entry.bucket}`,
      bucket: entry.bucket,
      title: `${entry.delta > 0 ? "Increase" : "Reduce"} ${labelMap[entry.bucket]}`,
      message: `Move ${Math.abs(entry.delta)}% ${entry.delta > 0 ? "into" : "out of"} ${labelMap[entry.bucket].toLowerCase()} to approach the assistant target mix.`,
      expectedRiskImpact: round(suggestedSimulation.risk.score - currentSimulation.risk.score, 1),
      expectedYieldImpact: round(suggestedSimulation.expectedYield.annualPercent - currentSimulation.expectedYield.annualPercent, 2),
      reason:
        entry.bucket === "stableReserve"
          ? "Improves downside protection and rebalancing flexibility."
          : entry.bucket === "staking"
            ? "Improves modeled yield efficiency while keeping risk contained."
            : entry.bucket === "liquidity"
              ? "Reduces LP concentration and impermanent loss sensitivity."
              : "Brings the portfolio closer to a balanced bucket mix.",
      targetAllocation: entry.target,
      action:
        entry.bucket === "staking"
          ? buildAction("Open staking", "/dashboard/stake", "execute")
          : entry.bucket === "liquidity"
          ? buildAction("Open pools", "/dashboard/pools", "execute")
            : buildAction("Open strategy builder", "/dashboard/strategy", "plan"),
    }));
}

function buildOpportunities({ portfolio, currentAllocations, currentSimulation, riskSummary, riskBreakdown, yieldSuggestions }) {
  const opportunities = [];

  if (yieldSuggestions[0]) {
    opportunities.push({
      id: "yield-opportunity",
      type: "Yield Opportunity",
      title: yieldSuggestions[0].title,
      message: yieldSuggestions[0].message,
      impact: yieldSuggestions[0].impact,
      confidence: yieldSuggestions[0].confidence,
      action: yieldSuggestions[0].action,
      badge: "Top Opportunity",
    });
  }

  if (currentAllocations.stableReserve < 12) {
    opportunities.push({
      id: "resilience-opportunity",
      type: "Resilience Opportunity",
      title: "Increase stable reserve to improve downside protection",
      message: `Stable reserve is ${round(currentAllocations.stableReserve, 1)}% while the assistant target aims for a stronger defensive buffer.`,
      impact: "Lower portfolio volatility",
      confidence: 82,
      action: buildAction("Open risk engine", "/dashboard/risk", "resilience"),
      badge: "Portfolio Resilience",
    });
  }

  if (riskBreakdown.borrow?.score === 0 && currentSimulation.assumptions.lendingSupplyApr > 0 && portfolio.totalPortfolioUsd > 0) {
    opportunities.push({
      id: "lending-opportunity",
      type: "Efficiency Opportunity",
      title: "Conservative lending yield is available for reserve capital",
      message: `Modeled lending supply yield is ${round(currentSimulation.assumptions.lendingSupplyApr, 2)}% for low-volatility deployment.`,
      impact: "Incremental passive yield",
      confidence: 68,
      action: buildAction("Open borrow page", "/dashboard/borrow", "lending"),
      badge: "Yield Efficiency",
    });
  }

  if (riskSummary.trendDirection === "Risk improving") {
    opportunities.push({
      id: "trend-opportunity",
      type: "Monitoring Opportunity",
      title: "Portfolio risk is improving",
      message: riskSummary.whatChangedThisWeek,
      impact: "Improved portfolio resilience",
      confidence: 71,
      action: buildAction("View analytics", "/dashboard/analytics", "trend"),
      badge: "Trend Signal",
    });
  }

  return opportunities.slice(0, 4);
}

function buildExplanation(aiAdvice, riskSummary, currentSimulation, suggestedSimulation, currentAllocations) {
  return [
    {
      id: "allocation-dominance",
      question: "Why is concentration highlighted?",
      answer: `${aiAdvice.dominantAsset} represents ${round(aiAdvice.dominantAllocation, 1)}% of visible portfolio value. High single-asset dominance amplifies volatility and concentration risk.`,
      sourceMetric: "Dominant allocation",
      sourceValue: `${round(aiAdvice.dominantAllocation, 1)}%`,
    },
    {
      id: "risk-driver",
      question: "Why is portfolio risk rated this way?",
      answer: riskSummary.explanationSummary,
      sourceMetric: "Portfolio risk score",
      sourceValue: `${riskSummary.totalRiskScore}/100`,
    },
    {
      id: "rebalance-impact",
      question: "Why is the assistant suggesting a rebalance?",
      answer: `The suggested mix is expected to move annual yield from ${round(currentSimulation.expectedYield.annualPercent, 2)}% to ${round(suggestedSimulation.expectedYield.annualPercent, 2)}% while adjusting risk from ${round(currentSimulation.risk.score, 1)} to ${round(suggestedSimulation.risk.score, 1)}.`,
      sourceMetric: "Target stable reserve",
      sourceValue: `${round(currentAllocations.stableReserve, 1)}% -> ${round(suggestedSimulation.allocations.stableReserve, 1)}%`,
    },
  ];
}

function summarizeAssistant(aiAdvice, riskSummary, currentSimulation, opportunities, warnings) {
  const topOpportunity = opportunities[0] || {
    title: "Maintain current allocation",
    message: "No urgent optimization opportunity detected at the moment.",
    confidence: 62,
    action: buildAction("View analytics", "/dashboard/analytics", "overview"),
    badge: "Stable Setup",
  };
  const topRisk = warnings[0] || {
    title: "No major risk driver detected",
    message: "Current portfolio posture remains within the lower-risk band.",
    severity: "info",
    confidence: 60,
    action: buildAction("Open risk engine", "/dashboard/risk", "monitor"),
  };

  return {
    portfolioStatus: {
      label: portfolioHealthLabel(riskSummary.totalRiskScore),
      score: riskSummary.totalRiskScore,
      confidence: aiAdvice.confidence,
      summary: riskSummary.explanationSummary,
    },
    topOpportunity,
    topRisk,
    topYieldSource: {
      label: currentSimulation.explainability.highestYieldBucket,
      annualRate: round(currentSimulation.expectedYield.annualPercent, 2),
      contributionPercent:
        currentSimulation.rewardEstimate.byBucket
          .slice()
          .sort((a, b) => b.contributionPercent - a.contributionPercent)[0]?.contributionPercent || 0,
    },
    diversificationStatus: {
      label: diversificationLabel(aiAdvice.diversificationScore),
      score: aiAdvice.diversificationScore,
      summary:
        aiAdvice.diversificationScore >= 70
          ? "Asset mix is relatively balanced across the visible wallet."
          : "Allocation remains concentrated and would benefit from a broader asset mix.",
    },
    yieldEfficiencyScore: clamp(
      round(
        currentSimulation.expectedYield.annualPercent * 3.4 -
          riskSummary.totalRiskScore * 0.42 +
          aiAdvice.diversificationScore * 0.28,
        1,
      ),
      0,
      100,
    ),
  };
}

async function computeAssistantDataset(userId, requestedWalletAddress, { persist = false } = {}) {
  const { walletAddress } = await ensureAccessibleWallet(userId, requestedWalletAddress);
  const [portfolio, walletInsights, riskSummary, riskBreakdown, riskRecommendations] = await Promise.all([
    getWalletPortfolio(userId, walletAddress, "Retix Wallet"),
    getWalletInsightsSummary(userId, walletAddress),
    getRiskSummary(userId, walletAddress),
    getRiskBreakdown(userId, walletAddress),
    getRiskRecommendations(userId, walletAddress),
  ]);

  if (!portfolio.tokens?.length || portfolio.totalPortfolioUsd <= 0) {
    return {
      walletAddress,
      generatedAt: new Date().toISOString(),
      mode: "Rule-Based Insights",
      summaryText: "Not enough portfolio data is available yet to generate assistant guidance.",
      disclaimer: DISCLAIMER,
      portfolioStatus: {
        label: "Data Pending",
        score: 0,
        confidence: 0,
        summary: "Connect and use the wallet to accumulate portfolio and protocol data first.",
      },
      topOpportunity: null,
      topRisk: null,
      topYieldSource: null,
      diversificationStatus: {
        label: "No Data",
        score: 0,
        summary: "Diversification will appear once token balances are available.",
      },
      yieldEfficiencyScore: 0,
      insights: [],
      yieldSuggestions: [],
      riskWarnings: [],
      rebalancing: [],
      opportunities: [],
      explanation: [],
      actionLinks: buildActionLinks(),
      source: "assistant-rule-engine",
    };
  }

  const aiAdvice = await getPortfolioAdvice({
    userId,
    walletAddress,
    portfolio: portfolio.tokens.map((token) => ({
      symbol: token.symbol,
      balance: token.balance,
      value: token.usdValue,
      price: token.usdValue && token.balance ? token.usdValue / Math.max(token.balance, 1e-9) : 0,
      change24h: token.change,
    })),
    historicalData: portfolio.balanceHistory,
    persist: false,
  });

  const currentAllocations = deriveStrategyAllocations(portfolio, riskSummary);
  const currentSimulation = await simulateStrategy(userId, {
    name: "Current Portfolio Mirror",
    allocations: currentAllocations,
    portfolioCapital: portfolio.totalPortfolioUsd,
    timeframe: "1Y",
    scenario: "base",
  });
  const suggestedAllocations = buildTargetAllocations(currentAllocations, aiAdvice, riskBreakdown);
  const suggestedSimulation = await simulateStrategy(userId, {
    name: "Assistant Suggested Allocation",
    allocations: suggestedAllocations,
    portfolioCapital: portfolio.totalPortfolioUsd,
    timeframe: "1Y",
    scenario: "base",
  });

  const insights = buildPortfolioInsights({
    aiAdvice,
    riskBreakdown,
    riskSummary,
    walletInsights,
    currentSimulation,
  });
  const yieldSuggestions = buildYieldSuggestions({
    portfolio,
    currentSimulation,
    riskBreakdown,
    currentAllocations,
  });
  const riskWarnings = buildRiskWarnings({
    riskSummary,
    riskBreakdown,
  });
  const rebalancing = buildRebalancingSuggestions({
    currentAllocations,
    currentSimulation,
    suggestedAllocations,
    suggestedSimulation,
  });
  const opportunities = buildOpportunities({
    portfolio,
    currentAllocations,
    currentSimulation,
    riskSummary,
    riskBreakdown,
    yieldSuggestions,
  });
  const explanation = buildExplanation(
    aiAdvice,
    riskSummary,
    currentSimulation,
    suggestedSimulation,
    currentAllocations,
  );
  const summary = summarizeAssistant(
    aiAdvice,
    riskSummary,
    currentSimulation,
    opportunities,
    riskWarnings,
  );

  const dataset = {
    walletAddress,
    generatedAt: new Date().toISOString(),
    mode: "Rule-Based Insights",
    summaryText: `${summary.portfolioStatus.label} posture detected. ${summary.topOpportunity?.title || "No major opportunity"} stands out as the clearest next action, while ${summary.topRisk?.title || "no major risk"} remains the primary watch item.`,
    disclaimer: DISCLAIMER,
    portfolioStatus: summary.portfolioStatus,
    topOpportunity: summary.topOpportunity,
    topRisk: summary.topRisk,
    topYieldSource: summary.topYieldSource,
    diversificationStatus: summary.diversificationStatus,
    yieldEfficiencyScore: summary.yieldEfficiencyScore,
    insights,
    yieldSuggestions,
    riskWarnings,
    rebalancing,
    opportunities,
    explanation,
    actionLinks: buildActionLinks(),
    source: "assistant-rule-engine",
    metadata: {
      riskRecommendations: riskRecommendations.recommendations || [],
      currentAllocations,
      suggestedAllocations,
      currentSimulation: {
        riskScore: currentSimulation.risk.score,
        annualYieldPercent: currentSimulation.expectedYield.annualPercent,
      },
      suggestedSimulation: {
        riskScore: suggestedSimulation.risk.score,
        annualYieldPercent: suggestedSimulation.expectedYield.annualPercent,
      },
    },
  };

  if (persist) {
    await AIAdvice.create({
      userId,
      walletAddress,
      portfolioSnapshot: {
        totalValue: portfolio.totalPortfolioUsd,
        allocations: portfolio.allocation,
        historicalData: portfolio.balanceHistory,
      },
      recommendations: [
        ...yieldSuggestions.map((item) => item.title),
        ...riskWarnings.map((item) => item.title),
      ].slice(0, 6),
      riskLevel: summary.portfolioStatus.label,
      portfolioInsights: insights.map((item) => item.title).slice(0, 6),
      confidence: summary.portfolioStatus.confidence,
      assistantSnapshot: {
        portfolioStatus: summary.portfolioStatus.label,
        score: summary.portfolioStatus.score,
        topOpportunity: summary.topOpportunity?.title,
        topRisk: summary.topRisk?.title,
        diversificationScore: summary.diversificationStatus.score,
        generatedAt: dataset.generatedAt,
        summaryText: dataset.summaryText,
      },
      source: "assistant-rule-engine",
    });
  }

  return dataset;
}

export async function getAssistantSummary(userId, walletAddress) {
  return computeAssistantDataset(userId, walletAddress);
}

export async function getAssistantInsights(userId, walletAddress) {
  const dataset = await computeAssistantDataset(userId, walletAddress);
  return {
    walletAddress: dataset.walletAddress,
    generatedAt: dataset.generatedAt,
    items: dataset.insights,
    source: dataset.source,
  };
}

export async function getAssistantYieldSuggestions(userId, walletAddress) {
  const dataset = await computeAssistantDataset(userId, walletAddress);
  return {
    walletAddress: dataset.walletAddress,
    generatedAt: dataset.generatedAt,
    items: dataset.yieldSuggestions,
    source: dataset.source,
  };
}

export async function getAssistantRiskWarnings(userId, walletAddress) {
  const dataset = await computeAssistantDataset(userId, walletAddress);
  return {
    walletAddress: dataset.walletAddress,
    generatedAt: dataset.generatedAt,
    items: dataset.riskWarnings,
    source: dataset.source,
  };
}

export async function getAssistantRebalancing(userId, walletAddress) {
  const dataset = await computeAssistantDataset(userId, walletAddress);
  return {
    walletAddress: dataset.walletAddress,
    generatedAt: dataset.generatedAt,
    items: dataset.rebalancing,
    source: dataset.source,
  };
}

export async function getAssistantOpportunities(userId, walletAddress) {
  const dataset = await computeAssistantDataset(userId, walletAddress);
  return {
    walletAddress: dataset.walletAddress,
    generatedAt: dataset.generatedAt,
    items: dataset.opportunities,
    source: dataset.source,
  };
}

export async function refreshAssistantInsights(userId, walletAddress) {
  return computeAssistantDataset(userId, walletAddress, { persist: true });
}

export async function getAssistantHistory(userId, walletAddress) {
  await ensureAccessibleWallet(userId, walletAddress);

  const items = await AIAdvice.find({
    userId,
    walletAddress,
    assistantSnapshot: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .limit(24)
    .lean();

  return {
    walletAddress,
    items: items.map((item) => ({
      id: String(item._id),
      createdAt: item.createdAt,
      portfolioStatus: item.assistantSnapshot?.portfolioStatus || item.riskLevel,
      score: item.assistantSnapshot?.score || 0,
      topOpportunity: item.assistantSnapshot?.topOpportunity || null,
      topRisk: item.assistantSnapshot?.topRisk || null,
      diversificationScore: item.assistantSnapshot?.diversificationScore || 0,
      confidence: item.confidence || 0,
      summaryText: item.assistantSnapshot?.summaryText || "",
    })),
    source: "assistant-history",
  };
}
