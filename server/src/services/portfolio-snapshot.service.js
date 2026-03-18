import { PortfolioSnapshot } from "../models/PortfolioSnapshot.js";
import { getWalletPortfolio } from "./wallet.service.js";
import { findUserByWalletAddress } from "./user.service.js";

export async function listPortfolioSnapshots(walletAddress) {
  return PortfolioSnapshot.find({ walletAddress }).sort({ takenAt: -1 }).limit(30).lean();
}

export async function rebuildPortfolioSnapshot(walletAddress) {
  const user = await findUserByWalletAddress(walletAddress);
  const portfolio = await getWalletPortfolio(user._id, walletAddress, "Retix Wallet");
  const totalValue = portfolio.totalPortfolioUsd || 0;
  const tokenBreakdown = portfolio.tokens.map((token) => ({
    symbol: token.symbol,
    amount: token.balance,
    price: token.price || token.usdValue / Math.max(token.balance, 1),
    value: token.usdValue,
    allocationPercent: totalValue ? Number(((token.usdValue / totalValue) * 100).toFixed(2)) : 0,
  }));

  const snapshot = await PortfolioSnapshot.create({
    walletAddress,
    userId: user._id,
    totalValue,
    totalInvested: totalValue * 0.82,
    pnl: totalValue * 0.18,
    tokenBreakdown,
    takenAt: new Date(),
  });

  return snapshot.toObject();
}
