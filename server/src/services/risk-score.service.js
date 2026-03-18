import { getWalletScoreForAddress } from "./wallet-score.service.js";

export async function getRiskScoreSnapshot(userId, walletAddress, options) {
  return getWalletScoreForAddress(userId, walletAddress, options);
}
