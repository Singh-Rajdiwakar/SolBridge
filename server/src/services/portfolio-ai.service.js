import { AIAdvice } from "../models/AIAdvice.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { getTokenPrice } from "../utils/tokens.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildDefaultPortfolio(user) {
  return user.balances.map((balance) => ({
    symbol: balance.token,
    balance: balance.amount,
    price: getTokenPrice(balance.token),
    value: Number((balance.amount * getTokenPrice(balance.token)).toFixed(2)),
    change24h: balance.token === "USDC" ? 0.1 : 3.4,
  }));
}

export async function getPortfolioAdvice({
  userId,
  portfolio,
  historicalData = [],
  walletAddress,
  persist = true,
}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const normalizedPortfolio = Array.isArray(portfolio) && portfolio.length > 0 ? portfolio : buildDefaultPortfolio(user);
  const totalValue = normalizedPortfolio.reduce((sum, asset) => sum + Number(asset.value || 0), 0);
  const allocations = normalizedPortfolio
    .filter((asset) => Number(asset.value || 0) > 0)
    .map((asset) => ({
      symbol: asset.symbol,
      value: Number(asset.value || 0),
      percentage: totalValue ? Number((((Number(asset.value || 0)) / totalValue) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);
  const dominant = allocations[0] || { symbol: "SOL", percentage: 0 };
  const stablecoinShare = allocations
    .filter((asset) => ["USDC", "USDT"].includes(asset.symbol))
    .reduce((sum, asset) => sum + asset.percentage, 0);
  const diversificationScore = clamp(
    Math.round(
      allocations.length * 14 +
        Math.max(0, 35 - dominant.percentage / 2) +
        Math.min(stablecoinShare, 25),
    ),
    18,
    96,
  );

  let riskLevel = "Low";
  if (dominant.percentage >= 70 || stablecoinShare < 8) {
    riskLevel = "High";
  } else if (dominant.percentage >= 50 || stablecoinShare < 15) {
    riskLevel = "Medium";
  }

  const recommendations = [];
  if (dominant.percentage >= 60) {
    recommendations.push(
      `${dominant.symbol} dominates ${dominant.percentage}% of the wallet. Consider reallocating 15-20% into stable assets.`,
    );
  }
  if (stablecoinShare < 12) {
    recommendations.push("Stablecoin allocation is thin. A 10-15% reserve can reduce volatility and improve optionality.");
  }
  if (allocations.length <= 3) {
    recommendations.push("Portfolio breadth is narrow. Add one or two uncorrelated assets to improve diversification.");
  }
  if (historicalData.length > 0) {
    recommendations.push("Historical curve is trending positively. Rebalancing gains into lower-beta assets can lock in performance.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Allocation looks balanced. Maintain periodic rebalancing and keep a stablecoin reserve for flexibility.");
  }

  const portfolioInsights = [
    `${dominant.symbol} is currently the largest position at ${dominant.percentage.toFixed(1)}% of wallet value.`,
    `Diversification score is ${diversificationScore}/100 based on breadth, concentration, and stablecoin coverage.`,
    stablecoinShare >= 12
      ? "Stablecoin exposure provides a reasonable volatility buffer."
      : "Stablecoin exposure is low, which can amplify portfolio drawdowns.",
  ];

  const confidence = clamp(Math.round(74 + allocations.length * 4 - Math.max(0, dominant.percentage - 55) / 4), 62, 96);
  const payload = {
    userId,
    walletAddress: walletAddress || user.walletAddress,
    portfolioSnapshot: {
      totalValue: Number(totalValue.toFixed(2)),
      allocations,
      historicalData,
    },
    recommendations,
    riskLevel,
    portfolioInsights,
    confidence,
    source: "portfolio-ai",
  };

  if (persist) {
    await AIAdvice.create(payload);
  }

  return {
    riskLevel,
    recommendations,
    portfolioInsights,
    confidence,
    diversificationScore,
    dominantAsset: dominant.symbol,
    dominantAllocation: dominant.percentage,
    stablecoinShare: Number(stablecoinShare.toFixed(2)),
  };
}
