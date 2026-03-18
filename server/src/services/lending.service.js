import { LendingMarket } from "../models/LendingMarket.js";
import { LendingPosition } from "../models/LendingPosition.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { adjustUserBalance, getUserBalance } from "../utils/balances.js";
import { calculateLendingMetrics, getTokenPrice } from "../utils/tokens.js";

function upsertAsset(assets, token, amountDelta) {
  const asset = assets.find((entry) => entry.token === token);
  if (asset) {
    asset.amount = Number((asset.amount + amountDelta).toFixed(6));
    asset.value = Number((asset.amount * getTokenPrice(token)).toFixed(2));
  } else if (amountDelta > 0) {
    assets.push({
      token,
      amount: Number(amountDelta.toFixed(6)),
      value: Number((amountDelta * getTokenPrice(token)).toFixed(2)),
    });
  }

  return assets.filter((entry) => entry.amount > 0);
}

async function ensurePosition(userId) {
  let position = await LendingPosition.findOne({ userId });
  if (!position) {
    position = await LendingPosition.create({ userId, suppliedAssets: [], borrowedAssets: [] });
  }
  return position;
}

async function syncPosition(position) {
  const metrics = calculateLendingMetrics(position);
  position.collateralValue = Number(metrics.collateralValue.toFixed(2));
  position.borrowValue = Number(metrics.borrowValue.toFixed(2));
  position.healthFactor = Number(metrics.healthFactor.toFixed(2));
  position.availableBorrow = Number(metrics.availableToBorrow.toFixed(2));
  position.liquidationThreshold = Number(metrics.liquidationThreshold.toFixed(2));
  await position.save();
  return {
    ...position.toObject(),
    availableToBorrow: Number(metrics.availableToBorrow.toFixed(2)),
    netApy: Number((4.8 - position.borrowedAssets.length * 1.1).toFixed(2)),
    collateralRatio: Number(metrics.collateralRatio.toFixed(2)),
    liquidationThreshold: Number(metrics.liquidationThreshold.toFixed(2)),
  };
}

export async function getMarkets(userId) {
  const [markets, user] = await Promise.all([LendingMarket.find(), User.findById(userId)]);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return markets.map((market) => ({
    ...market.toObject(),
    walletBalance: getUserBalance(user, market.token),
  }));
}

export async function getPosition(userId) {
  const position = await ensurePosition(userId);
  return syncPosition(position);
}

export async function supplyAsset(userId, { token, amount }) {
  const [user, market, position] = await Promise.all([
    User.findById(userId),
    LendingMarket.findOne({ token }),
    ensurePosition(userId),
  ]);

  if (!user || !market) {
    throw new AppError("Market or user not found", 404);
  }

  if (getUserBalance(user, token) < amount) {
    throw new AppError("Insufficient wallet balance", 400);
  }

  adjustUserBalance(user, token, -amount);
  await user.save();

  position.suppliedAssets = upsertAsset(position.suppliedAssets, token, amount);
  market.totalSupplied = Number((market.totalSupplied + amount).toFixed(6));
  market.utilization = Number(Math.min(95, (market.totalBorrowed / market.totalSupplied) * 100).toFixed(2));

  await Promise.all([
    position.save(),
    market.save(),
    Transaction.create({
      userId,
      type: "Supply",
      token,
      amount,
      status: "completed",
    }),
  ]);

  return syncPosition(position);
}

export async function withdrawAsset(userId, { token, amount }) {
  const [user, market, position] = await Promise.all([
    User.findById(userId),
    LendingMarket.findOne({ token }),
    ensurePosition(userId),
  ]);

  if (!user || !market) {
    throw new AppError("Market or user not found", 404);
  }

  const supplied = position.suppliedAssets.find((asset) => asset.token === token);
  if (!supplied || supplied.amount < amount) {
    throw new AppError("Insufficient supplied amount", 400);
  }

  position.suppliedAssets = upsertAsset(position.suppliedAssets, token, -amount);
  const projected = calculateLendingMetrics(position);
  if (projected.borrowValue > 0 && projected.healthFactor < 1.1) {
    throw new AppError("Withdrawal would reduce health factor below safe threshold", 400);
  }

  adjustUserBalance(user, token, amount);
  await user.save();

  market.totalSupplied = Number(Math.max(0, market.totalSupplied - amount).toFixed(6));
  market.utilization = Number(
    Math.min(95, market.totalSupplied === 0 ? 0 : (market.totalBorrowed / market.totalSupplied) * 100).toFixed(2),
  );

  await Promise.all([
    position.save(),
    market.save(),
    Transaction.create({
      userId,
      type: "Withdraw",
      token,
      amount,
      status: "completed",
    }),
  ]);

  return syncPosition(position);
}

export async function borrowAsset(userId, { token, amount }) {
  const [user, market, position] = await Promise.all([
    User.findById(userId),
    LendingMarket.findOne({ token }),
    ensurePosition(userId),
  ]);

  if (!user || !market) {
    throw new AppError("Market or user not found", 404);
  }

  position.borrowedAssets = upsertAsset(position.borrowedAssets, token, amount);
  const projected = calculateLendingMetrics(position);
  if (projected.healthFactor < 1.05 || projected.availableToBorrow < 0) {
    throw new AppError("Borrow amount exceeds safe limits", 400);
  }

  adjustUserBalance(user, token, amount);
  await user.save();

  market.totalBorrowed = Number((market.totalBorrowed + amount).toFixed(6));
  market.utilization = Number(Math.min(95, (market.totalBorrowed / market.totalSupplied) * 100).toFixed(2));

  const writes = [
    position.save(),
    market.save(),
    Transaction.create({
      userId,
      type: "Borrow",
      token,
      amount,
      status: "completed",
    }),
  ];

  if (projected.healthFactor < 1.4) {
    writes.push(
      Transaction.create({
        userId,
        type: "Liquidation Warning",
        token,
        amount,
        status: "pending",
        metadata: { projectedHealthFactor: Number(projected.healthFactor.toFixed(2)) },
      }),
    );
  }

  await Promise.all(writes);

  return syncPosition(position);
}

export async function repayAsset(userId, { token, amount }) {
  const [user, market, position] = await Promise.all([
    User.findById(userId),
    LendingMarket.findOne({ token }),
    ensurePosition(userId),
  ]);

  if (!user || !market) {
    throw new AppError("Market or user not found", 404);
  }

  if (getUserBalance(user, token) < amount) {
    throw new AppError("Insufficient wallet balance", 400);
  }

  const borrowed = position.borrowedAssets.find((asset) => asset.token === token);
  if (!borrowed || borrowed.amount < amount) {
    throw new AppError("Repay amount exceeds borrowed balance", 400);
  }

  adjustUserBalance(user, token, -amount);
  await user.save();

  position.borrowedAssets = upsertAsset(position.borrowedAssets, token, -amount);
  market.totalBorrowed = Number(Math.max(0, market.totalBorrowed - amount).toFixed(6));
  market.utilization = Number(Math.min(95, (market.totalBorrowed / market.totalSupplied) * 100).toFixed(2));

  await Promise.all([
    position.save(),
    market.save(),
    Transaction.create({
      userId,
      type: "Repay",
      token,
      amount,
      status: "completed",
    }),
  ]);

  return syncPosition(position);
}

export async function simulateBorrow(userId, { asset, borrowAmount = 0, priceDropPercent = 0 }) {
  const position = await ensurePosition(userId);
  const cloned = {
    suppliedAssets: position.suppliedAssets.map((entry) => ({ ...(entry.toObject?.() || entry) })),
    borrowedAssets: position.borrowedAssets.map((entry) => ({ ...(entry.toObject?.() || entry) })),
  };

  if (borrowAmount > 0) {
    cloned.borrowedAssets = upsertAsset(cloned.borrowedAssets, asset, borrowAmount);
  }

  if (priceDropPercent > 0) {
    cloned.suppliedAssets = cloned.suppliedAssets.map((entry) => ({
      ...entry,
      value: Number((entry.value * (1 - priceDropPercent / 100)).toFixed(2)),
    }));
  }

  const metrics = calculateLendingMetrics(cloned);
  return {
    projectedHealthFactor: Number(metrics.healthFactor.toFixed(2)),
    projectedCollateralValue: Number(metrics.collateralValue.toFixed(2)),
    projectedBorrowValue: Number(metrics.borrowValue.toFixed(2)),
    liquidationRisk:
      metrics.healthFactor >= 2
        ? "safe"
        : metrics.healthFactor >= 1.5
          ? "moderate"
          : metrics.healthFactor >= 1.1
            ? "risky"
            : "danger",
  };
}

export async function getLendingHistory(userId) {
  return Transaction.find({
    userId,
    type: { $in: ["Supply", "Withdraw", "Borrow", "Repay", "Liquidation Warning"] },
  })
    .sort({ createdAt: -1 })
    .limit(50);
}
