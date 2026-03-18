import { AddressBook } from "../models/AddressBook.js";
import { SecurityCheck } from "../models/SecurityCheck.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { WalletScore } from "../models/WalletScore.js";
import { AppError } from "../utils/app-error.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mapWalletRiskLevel(score) {
  if (score >= 90) {
    return "Very Safe";
  }
  if (score >= 70) {
    return "Safe";
  }
  if (score >= 40) {
    return "Medium Risk";
  }
  if (score >= 20) {
    return "High Risk";
  }
  return "Critical Risk";
}

export async function getWalletScoreForAddress(
  userId,
  walletAddress,
  { persist = true } = {},
) {
  const [user, wallet, transactions, securityChecks, contactCount] = await Promise.all([
    User.findById(userId),
    Wallet.findOne({ userId }),
    Transaction.find({ userId }).sort({ createdAt: -1 }).limit(80),
    SecurityCheck.find({ walletAddress }).sort({ createdAt: -1 }).limit(30),
    AddressBook.countDocuments({ userId }),
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const knownTokenUniverse = new Set(["SOL", "USDC", "RTX", "BONK", "BTC", "ETH", "GOV", "STRK", "RAY", "mSOL"]);
  const unknownTokenInteractions = transactions.filter(
    (transaction) => !knownTokenUniverse.has(transaction.token),
  ).length;
  const failedTransactions = transactions.filter((transaction) => transaction.status === "failed").length;
  const suspiciousInteractions = securityChecks.filter((check) =>
    ["Suspicious", "High Risk", "Blocked"].includes(check.riskLevel),
  ).length;
  const sentTransactions = transactions.filter((transaction) => transaction.type === "Sent SOL");
  const averageSent =
    sentTransactions.length > 0
      ? sentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0) / sentTransactions.length
      : 0;
  const largeTransactionSpikes = sentTransactions.filter(
    (transaction) => averageSent > 0 && transaction.amount > averageSent * 2.5,
  ).length;
  const walletAgeDays = wallet?.createdAt
    ? Math.max(
        1,
        Math.round((Date.now() - new Date(wallet.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      )
    : 0;
  const transactionConsistency =
    sentTransactions.length <= 1 || averageSent === 0
      ? 85
      : Math.max(
          25,
          100 -
            Math.round(
              (sentTransactions.reduce(
                (sum, transaction) => sum + Math.abs(transaction.amount - averageSent),
                0,
              ) /
                sentTransactions.length /
                averageSent) *
                100,
            ),
        );

  let score = 94;
  score -= unknownTokenInteractions * 6;
  score -= failedTransactions * 8;
  score -= suspiciousInteractions * 7;
  score -= largeTransactionSpikes * 5;
  if (walletAgeDays < 7) {
    score -= 12;
  } else if (walletAgeDays < 30) {
    score -= 6;
  }
  if (contactCount >= 3) {
    score += 4;
  }
  if (transactionConsistency >= 80) {
    score += 3;
  }

  score = clamp(Math.round(score), 0, 100);
  const riskLevel = mapWalletRiskLevel(score);
  const recommendations = [];

  if (suspiciousInteractions > 0) {
    recommendations.push("Avoid interacting with receivers that previously triggered suspicious or high-risk checks.");
  }
  if (failedTransactions > 0) {
    recommendations.push("Review failed transactions and clean up stale or malformed address interactions.");
  }
  if (contactCount < 3) {
    recommendations.push("Increase address verification by maintaining a stronger saved-contact list.");
  }
  if (largeTransactionSpikes > 0) {
    recommendations.push("Break large transfers into smaller steps when feasible to reduce anomaly risk.");
  }
  if (unknownTokenInteractions > 0) {
    recommendations.push("Avoid unknown token interactions unless the asset contract has been validated.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Wallet hygiene looks healthy. Continue verifying addresses before large sends.");
  }

  const metrics = {
    unknownTokenInteractions,
    largeTransactionSpikes,
    suspiciousInteractions,
    failedTransactions,
    walletAgeDays,
    transactionConsistency,
    addressBookCoverage: contactCount,
  };

  const payload = {
    walletAddress,
    score,
    riskLevel,
    recommendations,
    metrics,
    updatedAt: new Date().toISOString(),
  };

  if (persist) {
    await WalletScore.findOneAndUpdate(
      { walletAddress },
      {
        walletAddress,
        score,
        riskLevel,
        recommendations,
        metrics,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );
  }

  return payload;
}
