import { Token } from "../models/Token.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { adjustUserBalance, getUserBalance } from "../utils/balances.js";
import { getTokenPrice } from "../utils/tokens.js";
import { logger } from "../utils/logger.js";
import { markAddressBookEntryUsed } from "./address-book.service.js";
import { getGasOptimization } from "./gas-optimizer.service.js";
import { getWalletInsights } from "./insight.service.js";
import { listWalletNfts } from "./nft.service.js";
import {
  analyzeTransactionRisk,
  calculateTransactionConfidence,
} from "./security.service.js";
import {
  createSplToken,
  getBalance,
  getParsedTokenAccounts,
  getSignatureStatus,
  parsePublicKey,
  requestAirdrop,
  sendSol,
} from "./solana.service.js";
import { executeSimulatedSwap, previewSwapQuote } from "./swap.service.js";
import { createTransactionRecord, listTransactionRecords } from "./transaction.service.js";
import { ensureWalletAccount, getWalletAccountByUserId } from "./wallet-account.service.js";

const walletTransactionTypes = ["Sent SOL", "Received SOL", "Airdrop", "Token Creation", "Swap", "NFT Transfer"];
let tokenCache = {
  expiresAt: 0,
  items: [],
};

function getTrackedChange(symbol) {
  return {
    SOL: 4.2,
    USDC: 0.1,
    RTX: 12.8,
    BONK: 18.6,
    GOV: 3.4,
  }[symbol] ?? 1.2;
}

async function getTokenCatalog() {
  if (Date.now() < tokenCache.expiresAt && tokenCache.items.length > 0) {
    return tokenCache.items;
  }

  const items = await Token.find({}).sort({ symbol: 1 });
  tokenCache = {
    items,
    expiresAt: Date.now() + 1000 * 60 * 5,
  };
  return items;
}

async function getWalletUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

async function getEffectiveAddress(userId, address) {
  if (address) {
    parsePublicKey(address);
    return address;
  }

  const account = await ensureWalletAccount(userId);
  return account.publicKey;
}

function buildHistory(totalPortfolioUsd) {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => ({
    label,
    value: Number((totalPortfolioUsd * (0.92 + index * 0.018)).toFixed(2)),
  }));
}

function mapChainTokens(chainAccounts, tokenCatalog) {
  const byMint = new Map(
    tokenCatalog.filter((token) => token.mintAddress).map((token) => [token.mintAddress, token.symbol]),
  );

  return chainAccounts.reduce((acc, account) => {
    const symbol = byMint.get(account.mint);
    if (symbol) {
      acc[symbol] = account.amount;
    }
    return acc;
  }, {});
}

export async function getWalletBalance(userId, address, provider = "Retix Wallet") {
  const [user, effectiveAddress, tokenCatalog] = await Promise.all([
    getWalletUser(userId),
    getEffectiveAddress(userId, address),
    getTokenCatalog(),
  ]);

  const [{ sol: balanceSol }, parsedTokenAccounts] = await Promise.all([
    getBalance(effectiveAddress),
    getParsedTokenAccounts(effectiveAddress).catch(() => []),
  ]);

  const chainTokenBalances = mapChainTokens(parsedTokenAccounts, tokenCatalog);
  const trackedSymbols = Array.from(
    new Set(["SOL", "USDC", "RTX", "BONK", ...user.balances.map((entry) => entry.token), ...Object.keys(chainTokenBalances)]),
  );

  const tokens = trackedSymbols.map((symbol) => {
    const price = getTokenPrice(symbol);
    const balance =
      symbol === "SOL"
        ? balanceSol
        : chainTokenBalances[symbol] ?? getUserBalance(user, symbol);
    const value = Number((balance * price).toFixed(2));

    return {
      symbol,
      name: tokenCatalog.find((token) => token.symbol === symbol)?.name || symbol,
      price,
      balance,
      usdValue: value,
      value,
      change: getTrackedChange(symbol),
      change24h: getTrackedChange(symbol),
    };
  });

  return {
    walletAddress: effectiveAddress,
    address: effectiveAddress,
    solBalance: balanceSol,
    balanceSol,
    usdValue: Number((balanceSol * getTokenPrice("SOL")).toFixed(2)),
    usdEstimate: Number((balanceSol * getTokenPrice("SOL")).toFixed(2)),
    network: "Devnet",
    provider,
    tokens,
  };
}

export async function getWalletPortfolio(userId, address, provider = "Retix Wallet") {
  const balanceSnapshot = await getWalletBalance(userId, address, provider);
  const totalPortfolioUsd = balanceSnapshot.tokens.reduce((sum, token) => sum + token.value, 0);

  return {
    ...balanceSnapshot,
    totalPortfolioUsd: Number(totalPortfolioUsd.toFixed(2)),
    allocation: balanceSnapshot.tokens
      .filter((token) => token.value > 0)
      .map((token) => ({
        name: token.symbol,
        value: Number(token.value.toFixed(2)),
        percentage: totalPortfolioUsd ? Number(((token.value / totalPortfolioUsd) * 100).toFixed(2)) : 0,
      })),
    balanceHistory: buildHistory(totalPortfolioUsd),
  };
}

export async function getWalletTransactions(userId, query) {
  const effectiveAddress = query.address ? parsePublicKey(query.address).toBase58() : undefined;
  const result = await listTransactionRecords({
    userId,
    address: effectiveAddress,
    page: query.page || 1,
    limit: query.limit || 20,
    types: walletTransactionTypes,
  });

  if (result.items.length === 0 && effectiveAddress) {
    return listTransactionRecords({
      userId,
      page: query.page || 1,
      limit: query.limit || 20,
      types: walletTransactionTypes,
    });
  }

  return result;
}

export async function sendWalletTransaction(userId, payload) {
  const user = await getWalletUser(userId);
  const receiverAddress = payload.receiverAddress || payload.receiver;
  const effectiveAddress = await getEffectiveAddress(userId, payload.address || user.walletAddress);
  const securityCheck = await analyzeTransactionRisk({
    userId,
    walletAddress: effectiveAddress,
    receiverAddress,
    amount: payload.amount,
    token: payload.token || "SOL",
  });
  if (securityCheck.blocked) {
    throw new AppError("This transaction was blocked by Retix AI fraud detection", 403);
  }

  const gasOptimization = await getGasOptimization(userId);
  let signature = payload.signature;
  let status = "completed";
  let senderAddress = effectiveAddress;

  if (!signature) {
    const walletAccount = await getWalletAccountByUserId(userId, true);
    if (!walletAccount?.encryptedPrivateKey) {
      throw new AppError("No internal Retix wallet available for backend signing", 400);
    }

    const sent = await sendSol({
      encryptedPrivateKey: walletAccount.encryptedPrivateKey,
      receiverAddress,
      amount: payload.amount,
    });
    signature = sent.signature;
    senderAddress = sent.senderAddress;
  } else {
    const chainStatus = await getSignatureStatus(signature);
    status = chainStatus.status === "failed" ? "failed" : "completed";
  }

  adjustUserBalance(user, "SOL", -payload.amount);
  await user.save();

  await markAddressBookEntryUsed(userId, receiverAddress);

  const confidenceScore = calculateTransactionConfidence({
    riskScore: securityCheck.riskScore,
    successProbability: status === "failed" ? 18 : 96,
    congestionLevel: gasOptimization.congestionLevel,
  });

  const transaction = await createTransactionRecord({
    userId,
    type: "Sent SOL",
    token: "SOL",
    amount: payload.amount,
    receiver: receiverAddress,
    signature,
    status,
    network: "Devnet",
    metadata: {
      walletAddress: senderAddress,
      provider: payload.provider || "Retix Wallet",
      walletModule: true,
      note: payload.note,
      confidenceScore,
      riskLevel: securityCheck.riskLevel,
    },
  });

  logger.info("wallet.transaction.sent", {
    userId: String(userId),
    senderAddress,
    receiverAddress,
    amount: payload.amount,
    signature,
  });

  return {
    signature,
    status,
    riskLevel: securityCheck.riskLevel,
    confidenceScore,
    transaction,
  };
}

export async function airdropWallet(userId, payload) {
  const effectiveAddress = await getEffectiveAddress(userId, payload.address);
  const recentAirdrop = await createAirdropGuard(userId);
  if (recentAirdrop) {
    throw new AppError("Airdrop recently requested. Please wait before requesting again.", 429);
  }

  const response = await requestAirdrop(effectiveAddress, payload.amount || 1);
  const user = await getWalletUser(userId);
  adjustUserBalance(user, "SOL", response.amount);
  await user.save();

  const transaction = await createTransactionRecord({
    userId,
    type: "Airdrop",
    token: "SOL",
    amount: response.amount,
    receiver: effectiveAddress,
    signature: response.signature,
    status: "completed",
    network: "Devnet",
    metadata: {
      walletAddress: effectiveAddress,
      provider: "Retix Wallet",
      walletModule: true,
      confidenceScore: 99,
      riskLevel: "Safe",
    },
  });

  logger.info("wallet.airdrop.requested", {
    userId: String(userId),
    address: effectiveAddress,
    amount: response.amount,
    signature: response.signature,
  });

  return {
    signature: response.signature,
    amount: response.amount,
    transaction,
  };
}

async function createAirdropGuard(userId) {
  const since = new Date(Date.now() - 1000 * 60 * 15);
  const existing = await listTransactionRecords({
    userId,
    page: 1,
    limit: 1,
    types: ["Airdrop"],
  });
  return existing.items.find((item) => new Date(item.createdAt) >= since);
}

export async function createWalletToken(userId, payload) {
  const effectiveAddress = await getEffectiveAddress(userId, payload.address);
  const user = await getWalletUser(userId);
  let signature = payload.signature;
  let mintAddress = payload.mintAddress;

  if (!signature || !mintAddress) {
    const walletAccount = await getWalletAccountByUserId(userId, true);
    if (!walletAccount?.encryptedPrivateKey) {
      throw new AppError("No internal Retix wallet available for backend minting", 400);
    }

    const created = await createSplToken({
      encryptedPrivateKey: walletAccount.encryptedPrivateKey,
      name: payload.name,
      symbol: payload.symbol,
      decimals: payload.decimals,
      initialSupply: payload.initialSupply,
    });

    signature = created.transactionSignature;
    mintAddress = created.mintAddress;
  }

  adjustUserBalance(user, payload.symbol, payload.initialSupply);
  await user.save();

  await Token.findOneAndUpdate(
    { symbol: payload.symbol },
    {
      symbol: payload.symbol,
      name: payload.name,
      price: getTokenPrice(payload.symbol),
      icon: payload.symbol.slice(0, 2),
      change24h: getTrackedChange(payload.symbol),
      mintAddress,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );
  tokenCache.expiresAt = 0;

  const transaction = await createTransactionRecord({
    userId,
    type: "Token Creation",
    token: payload.symbol,
    amount: payload.initialSupply,
    receiver: mintAddress,
    signature,
    status: "completed",
    network: "Devnet",
    metadata: {
      walletAddress: effectiveAddress,
      provider: payload.provider || "Retix Wallet",
      walletModule: true,
      mintAddress,
      name: payload.name,
      symbol: payload.symbol,
      decimals: payload.decimals,
      confidenceScore: 94,
      riskLevel: "Safe",
    },
  });

  logger.info("wallet.token.created", {
    userId: String(userId),
    address: effectiveAddress,
    symbol: payload.symbol,
    mintAddress,
    signature,
  });

  return {
    mintAddress,
    transactionSignature: signature,
    transaction,
  };
}

export async function getWalletNfts(userId, address) {
  const effectiveAddress = await getEffectiveAddress(userId, address);
  return listWalletNfts(effectiveAddress);
}

export async function swapWallet(userId, payload) {
  const effectiveAddress = await getEffectiveAddress(userId, payload.address);
  if ((payload.mode || "preview") === "preview") {
    return previewSwapQuote(payload);
  }

  return executeSimulatedSwap({
    userId,
    address: effectiveAddress,
    provider: payload.provider || "Retix Wallet",
    ...payload,
  });
}

export async function getWalletInsightsSummary(userId, address) {
  const effectiveAddress = await getEffectiveAddress(userId, address);
  const transactions = await listTransactionRecords({
    userId,
    address: effectiveAddress,
    page: 1,
    limit: 100,
    types: walletTransactionTypes,
  });
  return getWalletInsights({
    userId,
    transactions: transactions.items,
  });
}

export async function ensureWalletContact(userId, payload) {
  try {
    await createAddressBookEntry(userId, payload);
  } catch {
    return null;
  }
  return null;
}
