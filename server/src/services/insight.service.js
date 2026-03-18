import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { getTokenPrice } from "../utils/tokens.js";

function buildTransactionFrequency(transactions) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const byLabel = new Map(labels.map((label) => [label, 0]));

  transactions.forEach((transaction) => {
    const label = new Date(transaction.createdAt).toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    });
    if (byLabel.has(label)) {
      byLabel.set(label, byLabel.get(label) + 1);
    }
  });

  return labels.map((label) => ({ label, value: byLabel.get(label) || 0 }));
}

function buildMonthlyVolume(transactions) {
  const labels = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const grouped = new Map(labels.map((label) => [label, 0]));

  transactions.forEach((transaction, index) => {
    const label = labels[index % labels.length];
    grouped.set(label, grouped.get(label) + transaction.amount);
  });

  return labels.map((label) => ({
    label,
    value: Number((grouped.get(label) || 0).toFixed(2)),
  }));
}

function buildProfitLossSeries(transactions) {
  let cumulative = 0;

  return transactions
    .slice()
    .reverse()
    .map((transaction, index) => {
      const signedAmount =
        transaction.type === "Sent SOL"
          ? -transaction.amount
          : transaction.type === "Swap"
            ? transaction.amount * 0.35
            : transaction.amount;
      cumulative += signedAmount;
      return {
        label: `T${index + 1}`,
        value: Number(cumulative.toFixed(2)),
      };
    });
}

export async function getWalletInsights({ transactions, userId }) {
  const [wallet, user] = await Promise.all([
    Wallet.findOne({ userId }),
    User.findById(userId),
  ]);

  const totalSent = transactions
    .filter((tx) => tx.type === "Sent SOL")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalReceived = transactions
    .filter((tx) => tx.type === "Received SOL" || tx.type === "Airdrop")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const tokenFrequency = transactions.reduce((acc, tx) => {
    acc[tx.token] = (acc[tx.token] || 0) + 1;
    return acc;
  }, {});
  const favoriteToken =
    Object.entries(tokenFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || "SOL";
  const gasSpent = Number((transactions.length * 0.000005).toFixed(6));
  const walletAge = wallet?.createdAt
    ? Math.max(
        1,
        Math.round((Date.now() - new Date(wallet.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      )
    : 0;
  const averageTxSize = transactions.length
    ? transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length
    : 0;
  const activityScore = Math.min(99, 35 + transactions.length * 8 + Math.min(walletAge, 20));
  const assetDistribution = (user?.balances || []).map((entry) => ({
    label: entry.token,
    value: Number((entry.amount * getTokenPrice(entry.token)).toFixed(2)),
  }));

  return {
    totalSent: Number(totalSent.toFixed(6)),
    totalReceived: Number(totalReceived.toFixed(6)),
    transactionCount: transactions.length,
    favoriteToken,
    gasSpent,
    walletAge,
    averageTxSize: Number(averageTxSize.toFixed(6)),
    activityScore,
    transactionFrequency: buildTransactionFrequency(transactions),
    monthlyVolume: buildMonthlyVolume(transactions),
    profitLossSeries: buildProfitLossSeries(transactions),
    assetDistribution,
  };
}
