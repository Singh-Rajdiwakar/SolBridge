import { AddressBook } from "../models/AddressBook.js";
import { SecurityCheck } from "../models/SecurityCheck.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { getTokenPrice } from "../utils/tokens.js";
import { getGasOptimization } from "./gas-optimizer.service.js";
import { getWalletScoreForAddress } from "./wallet-score.service.js";

const KNOWN_SCAM_ADDRESSES = new Set([
  "8nH8gQx4R9mYy7vP4Ar7L7hX4mXJ9Q6D8pM5sK2bW1Qa",
  "BLoCKeD4TnV4L1d4ddr355111111111111111111111",
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mapRiskLevel(score) {
  if (score >= 85) {
    return "Blocked";
  }
  if (score >= 60) {
    return "High Risk";
  }
  if (score >= 32) {
    return "Suspicious";
  }
  return "Safe";
}

function mapAlertSeverity(riskLevel) {
  if (riskLevel === "Blocked") {
    return "danger";
  }
  if (riskLevel === "High Risk") {
    return "warning";
  }
  if (riskLevel === "Suspicious") {
    return "caution";
  }
  return "info";
}

export function calculateTransactionConfidence({
  riskScore,
  successProbability = 97,
  congestionLevel = "Low",
}) {
  const congestionPenalty =
    congestionLevel === "High" ? 10 : congestionLevel === "Moderate" ? 4 : 0;
  return clamp(Math.round(successProbability - riskScore * 0.32 - congestionPenalty), 6, 99);
}

export async function analyzeTransactionRisk({
  userId,
  walletAddress,
  receiverAddress,
  amount,
  token = "SOL",
  persist = true,
}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const senderAddress = walletAddress || user.walletAddress;
  if (!receiverAddress) {
    throw new AppError("Receiver address is required", 400);
  }

  const [savedContact, sentTransactions, priorChecks] = await Promise.all([
    AddressBook.findOne({ userId, walletAddress: receiverAddress }),
    Transaction.find({
      userId,
      type: "Sent SOL",
      token,
    })
      .sort({ createdAt: -1 })
      .limit(20),
    SecurityCheck.find({ receiverAddress }).sort({ createdAt: -1 }).limit(8),
  ]);

  const warnings = [];
  let riskScore = 8;
  const tokenPrice = getTokenPrice(token);
  const walletBalance = user.balances.find((entry) => entry.token === token)?.amount ?? 0;
  const previousAmounts = sentTransactions.map((transaction) => transaction.amount);
  const averageAmount =
    previousAmounts.length > 0
      ? previousAmounts.reduce((sum, value) => sum + value, 0) / previousAmounts.length
      : amount;
  const priorReceiverHits = sentTransactions.filter(
    (transaction) => transaction.receiver === receiverAddress,
  ).length;
  const historicalHighRiskHits = priorChecks.filter((check) =>
    ["High Risk", "Blocked"].includes(check.riskLevel),
  ).length;
  const userTokenSet = new Set(user.balances.map((entry) => entry.token));

  if (KNOWN_SCAM_ADDRESSES.has(receiverAddress)) {
    riskScore += 90;
    warnings.push("Address is present in the blocked scam-address list.");
  }

  if (!savedContact) {
    riskScore += 12;
    warnings.push("Receiver is not in your verified address book.");
  } else {
    riskScore -= 14;
  }

  if (priorReceiverHits > 0) {
    riskScore -= 10;
  } else {
    riskScore += 8;
    warnings.push("This wallet has not been used previously from your account.");
  }

  if (historicalHighRiskHits > 0) {
    riskScore += 18;
    warnings.push("This receiver has recent high-risk history in wallet checks.");
  }

  if (!userTokenSet.has(token)) {
    riskScore += 7;
    warnings.push("This token has not previously appeared in your wallet activity.");
  }

  if (amount > averageAmount * 2.5 && sentTransactions.length >= 3) {
    riskScore += 18;
    warnings.push("Transfer size is materially larger than your normal pattern.");
  }

  if (walletBalance > 0 && amount > walletBalance * 0.55) {
    riskScore += 12;
    warnings.push("Transfer uses more than 55% of the tracked wallet balance.");
  }

  if (amount * tokenPrice > 3000) {
    riskScore += 10;
    warnings.push("USD value of this transfer is elevated and should be reviewed.");
  }

  if (warnings.length === 0) {
    warnings.push("No abnormal transaction signals detected.");
  }

  const riskLevel = mapRiskLevel(clamp(Math.round(riskScore), 0, 100));
  const confidence = clamp(68 + warnings.length * 6 + Math.round(riskScore * 0.14), 61, 99);

  const result = {
    walletAddress: senderAddress,
    receiverAddress,
    riskLevel,
    riskScore: clamp(Math.round(riskScore), 0, 100),
    confidence,
    warnings,
    blocked: riskLevel === "Blocked",
  };

  if (persist) {
    await SecurityCheck.create({
      walletAddress: senderAddress,
      receiverAddress,
      riskLevel,
      confidence,
      warnings,
    });
  }

  return result;
}

export async function getWalletAlerts({
  userId,
  walletAddress,
}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const effectiveWalletAddress = walletAddress || user.walletAddress;
  const [recentChecks, walletScore, gasOptimization] = await Promise.all([
    SecurityCheck.find({ walletAddress: effectiveWalletAddress })
      .sort({ createdAt: -1 })
      .limit(4),
    getWalletScoreForAddress(userId, effectiveWalletAddress, { persist: false }),
    getGasOptimization(userId),
  ]);

  const alerts = recentChecks
    .filter((check) => check.riskLevel !== "Safe")
    .map((check) => ({
      id: `check-${check._id}`,
      severity: mapAlertSeverity(check.riskLevel),
      title: `${check.riskLevel} receiver detected`,
      description: check.warnings[0] || "Recent transaction screening produced warnings.",
      source: "Fraud Detection",
      createdAt: check.createdAt,
    }));

  if (walletScore.score < 70) {
    alerts.push({
      id: `wallet-score-${effectiveWalletAddress}`,
      severity: walletScore.score < 40 ? "danger" : "warning",
      title: `Wallet risk score is ${walletScore.score}/100`,
      description: walletScore.recommendations[0] || "Review wallet hygiene recommendations.",
      source: "Wallet Score",
      createdAt: walletScore.updatedAt || new Date().toISOString(),
    });
  }

  if (gasOptimization.congestionLevel === "High") {
    alerts.push({
      id: `gas-${effectiveWalletAddress}-${gasOptimization.waitTimeMinutes}`,
      severity: "info",
      title: "Network congestion is elevated",
      description: `${gasOptimization.recommendation}. Current fee: ${gasOptimization.currentFee} SOL`,
      source: "Gas Optimizer",
      createdAt: new Date().toISOString(),
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: `stable-${effectiveWalletAddress}`,
      severity: "success",
      title: "No active security alerts",
      description: "Recent checks, score posture, and fee conditions are within safe operating bounds.",
      source: "Retix AI",
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}
