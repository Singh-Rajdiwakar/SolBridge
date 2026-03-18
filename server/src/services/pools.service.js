import { LiquidityPosition } from "../models/LiquidityPosition.js";
import { Pool } from "../models/Pool.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { adjustUserBalance, getUserBalance } from "../utils/balances.js";
import { calculateLiquidityShare, getTokenPrice } from "../utils/tokens.js";

function mapPoolWithShare(pool, positions) {
  const userPositions = positions.filter((position) => position.poolId.toString() === pool._id.toString());
  const totalUserValue = userPositions.reduce(
    (sum, position) =>
      sum + position.amountA * getTokenPrice(pool.tokenA) + position.amountB * getTokenPrice(pool.tokenB),
    0,
  );

  return {
    ...pool.toObject(),
    yourShare: Number(calculateLiquidityShare(totalUserValue, pool.totalLiquidity).toFixed(3)),
  };
}

export async function listPools(userId, params = {}) {
  const { search, sortBy = "totalLiquidity", order = "desc" } = params;
  const filter = search ? { pair: { $regex: search, $options: "i" } } : {};
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [pools, positions] = await Promise.all([
    Pool.find(filter).sort(sort),
    LiquidityPosition.find({ userId }),
  ]);

  return pools.map((pool) => mapPoolWithShare(pool, positions));
}

export async function getPoolById(userId, poolId) {
  const [pool, positions] = await Promise.all([
    Pool.findById(poolId),
    LiquidityPosition.find({ userId }),
  ]);

  if (!pool) {
    throw new AppError("Pool not found", 404);
  }

  return mapPoolWithShare(pool, positions);
}

export async function simulatePoolAction({ poolId, amountA, amountB }) {
  const pool = await Pool.findById(poolId);
  if (!pool) {
    throw new AppError("Pool not found", 404);
  }

  const usdValue = amountA * getTokenPrice(pool.tokenA) + amountB * getTokenPrice(pool.tokenB);
  const shareOfPool = calculateLiquidityShare(usdValue, pool.totalLiquidity);

  return {
    selectedPair: pool.pair,
    shareOfPool: Number(shareOfPool.toFixed(4)),
    expectedLpTokens: Number((usdValue / 12.5).toFixed(4)),
    estimatedApr: pool.apr,
    priceImpact: Number(pool.priceImpact.toFixed(3)),
    slippagePreview: Number(Math.min(2.5, shareOfPool / 14).toFixed(3)),
    tokenBAutoCalculated: Number(
      amountB || ((amountA * getTokenPrice(pool.tokenA)) / getTokenPrice(pool.tokenB)).toFixed(6),
    ),
  };
}

export async function addLiquidity(userId, payload) {
  const { poolId, amountA, amountB } = payload;
  const [user, pool] = await Promise.all([User.findById(userId), Pool.findById(poolId)]);

  if (!user || !pool) {
    throw new AppError("Pool or user not found", 404);
  }

  if (getUserBalance(user, pool.tokenA) < amountA || getUserBalance(user, pool.tokenB) < amountB) {
    throw new AppError("Insufficient balance to add liquidity", 400);
  }

  adjustUserBalance(user, pool.tokenA, -amountA);
  adjustUserBalance(user, pool.tokenB, -amountB);
  await user.save();

  const usdValue = amountA * getTokenPrice(pool.tokenA) + amountB * getTokenPrice(pool.tokenB);
  const position = await LiquidityPosition.create({
    userId,
    poolId,
    amountA,
    amountB,
    lpTokens: Number((usdValue / 12.5).toFixed(4)),
    feesEarned: 0,
  });

  pool.totalLiquidity = Number((pool.totalLiquidity + usdValue).toFixed(2));
  pool.volume24h = Number((pool.volume24h + usdValue * 0.18).toFixed(2));
  await pool.save();

  await Transaction.create({
    userId,
    type: "Add Liquidity",
    token: pool.pair,
    amount: usdValue,
    status: "completed",
    metadata: { positionId: position._id.toString() },
  });

  return position;
}

export async function removeLiquidity(userId, payload) {
  const { positionId, percent = 50 } = payload;
  const position = await LiquidityPosition.findOne({ _id: positionId, userId });
  if (!position) {
    throw new AppError("Position not found", 404);
  }

  const [user, pool] = await Promise.all([User.findById(userId), Pool.findById(position.poolId)]);
  if (!user || !pool) {
    throw new AppError("Pool or user not found", 404);
  }

  const fraction = percent / 100;
  const amountA = Number((position.amountA * fraction).toFixed(6));
  const amountB = Number((position.amountB * fraction).toFixed(6));
  const usdValue = amountA * getTokenPrice(pool.tokenA) + amountB * getTokenPrice(pool.tokenB);

  adjustUserBalance(user, pool.tokenA, amountA);
  adjustUserBalance(user, pool.tokenB, amountB);
  await user.save();

  position.amountA = Number((position.amountA - amountA).toFixed(6));
  position.amountB = Number((position.amountB - amountB).toFixed(6));
  position.lpTokens = Number((position.lpTokens * (1 - fraction)).toFixed(6));
  if (position.amountA <= 0 || position.amountB <= 0) {
    await position.deleteOne();
  } else {
    await position.save();
  }

  pool.totalLiquidity = Number((pool.totalLiquidity - usdValue).toFixed(2));
  await pool.save();

  await Transaction.create({
    userId,
    type: "Remove Liquidity",
    token: pool.pair,
    amount: usdValue,
    status: "completed",
    metadata: { percent, positionId },
  });

  return { amountA, amountB, usdValue };
}

export async function getMyPositions(userId) {
  const positions = await LiquidityPosition.find({ userId }).populate("poolId");
  return positions.map((position) => ({
    _id: position._id,
    poolId: position.poolId._id,
    pair: position.poolId.pair,
    amountA: position.amountA,
    amountB: position.amountB,
    lpTokens: position.lpTokens,
    feesEarned: position.feesEarned,
    apr: position.poolId.apr,
  }));
}

export async function getFeeHistory(userId) {
  const positions = await LiquidityPosition.find({ userId }).populate("poolId");
  const totalFees = positions.reduce((sum, position) => sum + position.feesEarned, 0);

  return Array.from({ length: 7 }, (_, index) => ({
    label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
    value: Number((totalFees * (0.6 + index * 0.08)).toFixed(2)),
  }));
}
