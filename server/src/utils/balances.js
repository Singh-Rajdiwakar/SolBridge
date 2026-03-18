import { getTokenPrice } from "./tokens.js";

export function adjustUserBalance(user, token, deltaAmount) {
  const existingBalance = user.balances.find((balance) => balance.token === token);
  if (existingBalance) {
    existingBalance.amount = Number((existingBalance.amount + deltaAmount).toFixed(6));
    existingBalance.fiatValue = Number((existingBalance.amount * getTokenPrice(token)).toFixed(2));
  } else {
    user.balances.push({
      token,
      amount: Number(deltaAmount.toFixed(6)),
      fiatValue: Number((deltaAmount * getTokenPrice(token)).toFixed(2)),
    });
  }
}

export function getUserBalance(user, token) {
  return user.balances.find((balance) => balance.token === token)?.amount || 0;
}
