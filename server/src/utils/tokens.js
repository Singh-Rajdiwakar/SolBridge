export const TOKEN_PRICES = {
  SOL: 152.4,
  USDC: 1,
  STRK: 2.14,
  RAY: 1.92,
  BTC: 68320,
  ETH: 3760,
  GOV: 4.25,
  RTX: 0.18,
  BONK: 0.000028,
};

export function getTokenPrice(token) {
  return TOKEN_PRICES[token] ?? 1;
}

export function normalizeApy(apy) {
  if (apy > 1) {
    return apy / 100;
  }
  return apy;
}

export function calculateStakeReward(amount, apy, durationDays) {
  const normalizedApy = normalizeApy(apy);
  return (amount * normalizedApy * durationDays) / 365;
}

export function calculatePendingStakeReward(stake) {
  const elapsedMs = Date.now() - new Date(stake.startedAt).getTime();
  const elapsedDays = Math.max(0, Math.min(stake.durationDays, elapsedMs / (1000 * 60 * 60 * 24)));
  const totalAccrued = calculateStakeReward(stake.amount, stake.apy, elapsedDays);
  return Math.max(0, totalAccrued - (stake.rewardEarned || 0));
}

export function calculateLiquidityShare(amountUsd, totalLiquidity) {
  if (!totalLiquidity) {
    return 100;
  }
  return (amountUsd / totalLiquidity) * 100;
}

export function calculateLendingMetrics(position) {
  const collateralValue = position.suppliedAssets.reduce((sum, asset) => sum + asset.value, 0);
  const borrowValue = position.borrowedAssets.reduce((sum, asset) => sum + asset.value, 0);
  const healthFactor = borrowValue === 0 ? 999 : (collateralValue * 0.78) / borrowValue;
  const availableToBorrow = Math.max(0, collateralValue * 0.7 - borrowValue);
  const collateralRatio = borrowValue === 0 ? 0 : (collateralValue / borrowValue) * 100;
  return {
    collateralValue,
    borrowValue,
    healthFactor,
    availableToBorrow,
    collateralRatio,
    liquidationThreshold: collateralValue * 0.7,
  };
}

export function calculateVoteParticipation(proposal, totalVotingPower) {
  const votes = proposal.votesYes + proposal.votesNo + proposal.votesAbstain;
  if (!totalVotingPower) {
    return 0;
  }
  return (votes / totalVotingPower) * 100;
}
