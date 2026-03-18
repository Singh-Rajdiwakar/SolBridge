import { AdminSetting } from "../models/AdminSetting.js";
import { LockPeriod } from "../models/LockPeriod.js";
import { Stake } from "../models/Stake.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { adjustUserBalance, getUserBalance } from "../utils/balances.js";
import {
  calculatePendingStakeReward,
  calculateStakeReward,
  getTokenPrice,
} from "../utils/tokens.js";

function makeSparkline(seed) {
  return Array.from({ length: 7 }, (_, index) => ({
    value: Number((seed * (0.94 + index * 0.02 + Math.random() * 0.01)).toFixed(2)),
  }));
}

export async function getStakingOverview(userId, selectedToken = "SOL") {
  const [user, stakes, lockPeriods, transactions, totalStakers] = await Promise.all([
    User.findById(userId),
    Stake.find({ userId, status: "active" }).sort({ createdAt: -1 }),
    LockPeriod.find({ enabled: true }).sort({ durationDays: 1 }),
    Transaction.find({ userId }).sort({ createdAt: -1 }).limit(8),
    Stake.distinct("userId"),
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const filteredStakes = stakes.filter((stake) => stake.tokenSymbol === selectedToken);
  const totalStaked = stakes.reduce((sum, stake) => sum + stake.amount, 0);
  const totalEarned =
    stakes.reduce((sum, stake) => sum + stake.rewardEarned + calculatePendingStakeReward(stake), 0) || 0;
  const avgApy = stakes.length ? stakes.reduce((sum, stake) => sum + stake.apy, 0) / stakes.length : 0;
  const selectedTokenStaked = filteredStakes.reduce((sum, stake) => sum + stake.amount, 0);
  const selectedTokenReward = filteredStakes.reduce(
    (sum, stake) => sum + stake.rewardEarned + calculatePendingStakeReward(stake),
    0,
  );

  return {
    stats: [
      { title: "Total Staked", value: totalStaked, change: 12.8, suffix: " SOL", chartData: makeSparkline(totalStaked || 10) },
      { title: "Total Earned", value: totalEarned, change: 8.3, prefix: "$", chartData: makeSparkline(totalEarned || 3) },
      { title: "Total Stakers", value: totalStakers.length, change: 5.1, chartData: makeSparkline(totalStakers.length || 50) },
      { title: "APY Growth", value: avgApy || 12.4, change: 2.2, suffix: "%", chartData: makeSparkline(avgApy || 12.4) },
    ],
    walletBalance: getUserBalance(user, selectedToken),
    portfolio: {
      token: selectedToken,
      stakedAmount: selectedTokenStaked,
      fiatValue: Number((selectedTokenStaked * getTokenPrice(selectedToken)).toFixed(2)),
      rewardGrowth: Number(selectedTokenReward.toFixed(4)),
      chartData: Array.from({ length: 7 }, (_, index) => ({
        label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
        value: Number((selectedTokenStaked * (0.9 + index * 0.025)).toFixed(2)),
      })),
    },
    lockPeriods,
    transactions,
  };
}

export function calculateStakingProjection({ amount, durationDays, apy }) {
  const estimatedReward = calculateStakeReward(amount, apy, durationDays);
  return {
    estimatedReward: Number(estimatedReward.toFixed(6)),
    projectedValue: Number((amount + estimatedReward).toFixed(6)),
  };
}

export async function createStake(userId, payload) {
  const { tokenSymbol, amount, durationDays } = payload;
  const [settings, user, lockPeriod] = await Promise.all([
    AdminSetting.findOne(),
    User.findById(userId),
    LockPeriod.findOne({ durationDays, enabled: true }),
  ]);

  if (!settings?.poolActive || settings.maintenanceMode) {
    throw new AppError("Staking is currently unavailable", 400);
  }

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!lockPeriod) {
    throw new AppError("Selected lock period is not available", 400);
  }

  if (amount < lockPeriod.minAmount) {
    throw new AppError(`Minimum stake for ${lockPeriod.label} is ${lockPeriod.minAmount}`, 400);
  }

  if (getUserBalance(user, tokenSymbol) < amount) {
    throw new AppError("Insufficient balance for staking", 400);
  }

  adjustUserBalance(user, tokenSymbol, -amount);
  await user.save();

  const stake = await Stake.create({
    userId,
    tokenSymbol,
    amount,
    apy: lockPeriod.apy,
    durationDays: lockPeriod.durationDays,
    endsAt: new Date(Date.now() + lockPeriod.durationDays * 24 * 60 * 60 * 1000),
  });

  await Transaction.create({
    userId,
    type: "Stake",
    token: tokenSymbol,
    amount,
    status: "completed",
    metadata: { stakeId: stake._id.toString(), durationDays },
  });

  return stake;
}

export async function claimStakeRewards(userId, stakeId) {
  const [settings, user, stake] = await Promise.all([
    AdminSetting.findOne(),
    User.findById(userId),
    Stake.findOne({ _id: stakeId, userId, status: "active" }),
  ]);

  if (!settings || settings.claimsFrozen) {
    throw new AppError("Claiming rewards is currently disabled", 400);
  }

  if (!user || !stake) {
    throw new AppError("Stake not found", 404);
  }

  const reward = calculatePendingStakeReward(stake);
  if (reward <= 0) {
    throw new AppError("No rewards available to claim", 400);
  }

  stake.rewardEarned = Number((stake.rewardEarned + reward).toFixed(6));
  stake.claimedReward = Number((stake.claimedReward + reward).toFixed(6));
  await stake.save();

  adjustUserBalance(user, stake.tokenSymbol, reward);
  await user.save();

  await Transaction.create({
    userId,
    type: "Rewards Claim",
    token: stake.tokenSymbol,
    amount: reward,
    status: "completed",
    metadata: { stakeId: stake._id.toString() },
  });

  return { reward: Number(reward.toFixed(6)) };
}

export async function unstakePosition(userId, stakeId) {
  const [settings, user, stake] = await Promise.all([
    AdminSetting.findOne(),
    User.findById(userId),
    Stake.findOne({ _id: stakeId, userId, status: "active" }),
  ]);

  if (!settings || settings.withdrawalsFrozen) {
    throw new AppError("Withdrawals are currently disabled", 400);
  }

  if (!user || !stake) {
    throw new AppError("Stake not found", 404);
  }

  const pendingReward = calculatePendingStakeReward(stake);
  const isEarly = new Date(stake.endsAt).getTime() > Date.now();
  const penaltyPercent = isEarly ? settings.earlyWithdrawalFee : 0;
  const penaltyAmount = Number(((stake.amount * penaltyPercent) / 100).toFixed(6));
  const principalReturned = Number((stake.amount - penaltyAmount).toFixed(6));
  const totalReturned = Number((principalReturned + pendingReward).toFixed(6));

  stake.rewardEarned = Number((stake.rewardEarned + pendingReward).toFixed(6));
  stake.claimedReward = Number((stake.claimedReward + pendingReward).toFixed(6));
  stake.status = "unstaked";
  await stake.save();

  adjustUserBalance(user, stake.tokenSymbol, totalReturned);
  await user.save();

  await Transaction.create({
    userId,
    type: "Unstake",
    token: stake.tokenSymbol,
    amount: totalReturned,
    status: "completed",
    metadata: { stakeId: stake._id.toString(), penaltyAmount, pendingReward },
  });

  return { totalReturned, penaltyAmount };
}

export async function getStakingHistory(userId, token) {
  const query = {
    userId,
    ...(token ? { token } : {}),
  };

  return Transaction.find(query).sort({ createdAt: -1 }).limit(50);
}
