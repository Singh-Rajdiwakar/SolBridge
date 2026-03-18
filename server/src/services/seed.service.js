import bcrypt from "bcryptjs";

import { AIAdvice } from "../models/AIAdvice.js";
import { AddressBook } from "../models/AddressBook.js";
import { AdminSetting } from "../models/AdminSetting.js";
import { AdminLog } from "../models/AdminLog.js";
import { Alert } from "../models/Alert.js";
import { GovernanceMetadata } from "../models/GovernanceMetadata.js";
import { JobRunLog } from "../models/JobRunLog.js";
import { LendingMarket } from "../models/LendingMarket.js";
import { LendingPosition } from "../models/LendingPosition.js";
import { LiquidityPosition } from "../models/LiquidityPosition.js";
import { LockPeriod } from "../models/LockPeriod.js";
import { MarketPriceSnapshot } from "../models/MarketPriceSnapshot.js";
import { NFT } from "../models/NFT.js";
import { Pool } from "../models/Pool.js";
import { PortfolioSnapshot } from "../models/PortfolioSnapshot.js";
import { Proposal } from "../models/Proposal.js";
import { ProtocolHealthSnapshot } from "../models/ProtocolHealthSnapshot.js";
import { PublicWalletProfile } from "../models/PublicWalletProfile.js";
import { SecurityCheck } from "../models/SecurityCheck.js";
import { SharedPortfolioSnapshot } from "../models/SharedPortfolioSnapshot.js";
import { Stake } from "../models/Stake.js";
import { Token } from "../models/Token.js";
import { TreasuryConfig } from "../models/TreasuryConfig.js";
import { TreasuryEvent } from "../models/TreasuryEvent.js";
import { TreasurySnapshot } from "../models/TreasurySnapshot.js";
import { Transaction } from "../models/Transaction.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { User } from "../models/User.js";
import { Vote } from "../models/Vote.js";
import { Wallet } from "../models/Wallet.js";
import { WalletBadge } from "../models/WalletBadge.js";
import { WalletFollow } from "../models/WalletFollow.js";
import { WalletLeaderboardSnapshot } from "../models/WalletLeaderboardSnapshot.js";
import { WalletScore } from "../models/WalletScore.js";
import { Watchlist } from "../models/Watchlist.js";
import { generateWalletSecret } from "./solana.service.js";
import { getTokenPrice } from "../utils/tokens.js";

function makeSeries(base, drift = 0.03) {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => ({
    label,
    value: Number((base * (1 + drift * (index - 2) + Math.random() * 0.02)).toFixed(2)),
  }));
}

function makeBalances(entries) {
  return entries.map(([token, amount]) => ({
    token,
    amount,
    fiatValue: Number((amount * getTokenPrice(token)).toFixed(2)),
  }));
}

function createPublicKey() {
  return generateWalletSecret().publicKey;
}

export async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash("Demo123!", 10);
  const adminHash = await bcrypt.hash("Admin123!", 10);
  const adminWallet = generateWalletSecret();
  const demoWallet = generateWalletSecret();

  const opsWallet = createPublicKey();
  const treasuryWallet = createPublicKey();
  const otcDeskWallet = createPublicKey();
  const mintAddress = createPublicKey();
  const nftMintOne = createPublicKey();
  const nftMintTwo = createPublicKey();

  const [admin, demoUser] = await User.create([
    {
      name: "Ava Admin",
      email: "admin@solanablocks.io",
      password: adminHash,
      role: "admin",
      walletAddress: adminWallet.publicKey,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80",
      linkedWallets: [
        { address: adminWallet.publicKey, provider: "retix", isPrimary: true },
        { address: createPublicKey(), provider: "phantom", isPrimary: false },
      ],
      preferences: {
        favoriteCoins: ["BTC", "ETH", "SOL"],
        chartTimeframe: "7D",
        selectedCurrency: "usd",
        sidebarCollapsed: false,
        themeMode: "dark",
        defaultDashboardTab: "wallet",
        marketView: "overview",
        watchlistLayout: "grid",
      },
      balances: makeBalances([
        ["SOL", 185],
        ["USDC", 32000],
        ["BTC", 0.65],
        ["ETH", 8.4],
        ["GOV", 4200],
        ["RTX", 350000],
      ]),
    },
    {
      name: "Ray Solis",
      email: "demo@solanablocks.io",
      password: passwordHash,
      role: "user",
      walletAddress: demoWallet.publicKey,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&q=80",
      linkedWallets: [
        { address: demoWallet.publicKey, provider: "retix", isPrimary: true },
        { address: createPublicKey(), provider: "phantom", isPrimary: false },
        { address: createPublicKey(), provider: "backpack", isPrimary: false },
      ],
      preferences: {
        favoriteCoins: ["BTC", "ETH", "SOL", "BONK"],
        chartTimeframe: "24H",
        selectedCurrency: "usd",
        sidebarCollapsed: false,
        themeMode: "dark",
        defaultDashboardTab: "wallet",
        marketView: "overview",
        watchlistLayout: "grid",
      },
      balances: makeBalances([
        ["SOL", 96],
        ["USDC", 18450],
        ["STRK", 640],
        ["RAY", 1250],
        ["BTC", 0.18],
        ["ETH", 3.6],
        ["GOV", 1450],
        ["RTX", 125000],
        ["BONK", 24000000],
      ]),
    },
  ]);

  await Wallet.create([
    {
      userId: admin._id,
      publicKey: adminWallet.publicKey,
      encryptedPrivateKey: adminWallet.encryptedPrivateKey,
      provider: "Retix Wallet",
    },
    {
      userId: demoUser._id,
      publicKey: demoWallet.publicKey,
      encryptedPrivateKey: demoWallet.encryptedPrivateKey,
      provider: "Retix Wallet",
    },
  ]);

  await Token.create([
    { symbol: "SOL", name: "Solana", price: getTokenPrice("SOL"), icon: "SO", change24h: 4.2, mintAddress: createPublicKey() },
    { symbol: "USDC", name: "USD Coin", price: getTokenPrice("USDC"), icon: "US", change24h: 0.1, mintAddress: createPublicKey() },
    { symbol: "RTX", name: "Retix Token", price: getTokenPrice("RTX"), icon: "RT", change24h: 12.8, mintAddress },
    { symbol: "BONK", name: "Bonk", price: getTokenPrice("BONK"), icon: "BO", change24h: 18.6, mintAddress: createPublicKey() },
    { symbol: "STRK", name: "Stark", price: getTokenPrice("STRK"), icon: "ST", change24h: 6.1, mintAddress: createPublicKey() },
    { symbol: "RAY", name: "Raydium", price: getTokenPrice("RAY"), icon: "RA", change24h: 3.9, mintAddress: createPublicKey() },
    { symbol: "BTC", name: "Bitcoin", price: getTokenPrice("BTC"), icon: "BT", change24h: 2.2, mintAddress: createPublicKey() },
    { symbol: "ETH", name: "Ethereum", price: getTokenPrice("ETH"), icon: "ET", change24h: 1.7, mintAddress: createPublicKey() },
    { symbol: "GOV", name: "SolanaBlocks Governance", price: getTokenPrice("GOV"), icon: "GO", change24h: 3.4, mintAddress: createPublicKey() },
    { symbol: "mSOL", name: "Marinade Staked SOL", price: 168.4, icon: "MS", change24h: 2.8, mintAddress: createPublicKey() },
  ]);

  await AdminSetting.create({
    rewardRate: 14.2,
    apyType: "dynamic",
    poolActive: true,
    maxStakeLimit: 250000,
    poolCapacity: 2000000,
    earlyWithdrawalFee: 2.5,
    autoCompounding: true,
    maintenanceMode: false,
    claimsFrozen: false,
    withdrawalsFrozen: false,
  });

  const lockPeriods = await LockPeriod.create([
    { label: "7 Days", durationDays: 7, apy: 8.5, minAmount: 10, penaltyFee: 0.8, enabled: true },
    { label: "30 Days", durationDays: 30, apy: 12.4, minAmount: 25, penaltyFee: 1.2, enabled: true },
    { label: "90 Days", durationDays: 90, apy: 18.75, minAmount: 50, penaltyFee: 1.8, enabled: true },
    { label: "200 Days", durationDays: 200, apy: 24.4, minAmount: 120, penaltyFee: 2.4, enabled: true },
  ]);

  const stakes = await Stake.create([
    {
      userId: demoUser._id,
      tokenSymbol: "SOL",
      amount: 28.5,
      apy: 18.75,
      durationDays: 90,
      rewardEarned: 1.18,
      claimedReward: 0.54,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 66),
      status: "active",
    },
    {
      userId: demoUser._id,
      tokenSymbol: "STRK",
      amount: 220,
      apy: 12.4,
      durationDays: 30,
      rewardEarned: 2.45,
      claimedReward: 0,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
      status: "active",
    },
  ]);

  const pools = await Pool.create([
    { pair: "SOL / USDC", tokenA: "SOL", tokenB: "USDC", totalLiquidity: 3240000, apr: 18.4, volume24h: 645000, feePercent: 0.3, priceImpact: 0.12, tvlHistory: makeSeries(3100000) },
    { pair: "STRK / USDC", tokenA: "STRK", tokenB: "USDC", totalLiquidity: 1940000, apr: 22.1, volume24h: 488000, feePercent: 0.25, priceImpact: 0.16, tvlHistory: makeSeries(1880000) },
    { pair: "RAY / SOL", tokenA: "RAY", tokenB: "SOL", totalLiquidity: 1190000, apr: 15.8, volume24h: 235000, feePercent: 0.3, priceImpact: 0.21, tvlHistory: makeSeries(1120000) },
    { pair: "BTC / USDC", tokenA: "BTC", tokenB: "USDC", totalLiquidity: 7820000, apr: 9.7, volume24h: 1180000, feePercent: 0.15, priceImpact: 0.06, tvlHistory: makeSeries(7600000) },
    { pair: "ETH / USDC", tokenA: "ETH", tokenB: "USDC", totalLiquidity: 5410000, apr: 11.9, volume24h: 960000, feePercent: 0.2, priceImpact: 0.09, tvlHistory: makeSeries(5280000) },
  ]);

  await LiquidityPosition.create([
    {
      userId: demoUser._id,
      poolId: pools[0]._id,
      amountA: 12,
      amountB: 1828.8,
      lpTokens: 235.4,
      feesEarned: 145.8,
    },
    {
      userId: demoUser._id,
      poolId: pools[1]._id,
      amountA: 150,
      amountB: 321,
      lpTokens: 84.1,
      feesEarned: 56.24,
    },
  ]);

  await LendingMarket.create([
    { token: "SOL", supplyApr: 5.2, borrowApr: 9.8, utilization: 74, collateralFactor: 75, totalSupplied: 182000, totalBorrowed: 135000 },
    { token: "USDC", supplyApr: 6.1, borrowApr: 8.7, utilization: 81, collateralFactor: 90, totalSupplied: 640000, totalBorrowed: 518000 },
    { token: "STRK", supplyApr: 4.8, borrowApr: 10.3, utilization: 66, collateralFactor: 70, totalSupplied: 210000, totalBorrowed: 138000 },
    { token: "BTC", supplyApr: 3.6, borrowApr: 7.2, utilization: 58, collateralFactor: 80, totalSupplied: 1420, totalBorrowed: 824 },
    { token: "ETH", supplyApr: 4.1, borrowApr: 7.8, utilization: 63, collateralFactor: 78, totalSupplied: 9100, totalBorrowed: 5720 },
  ]);

  await LendingPosition.create({
    userId: demoUser._id,
    suppliedAssets: [
      { token: "USDC", amount: 6200, value: 6200 },
      { token: "SOL", amount: 18, value: Number((18 * getTokenPrice("SOL")).toFixed(2)) },
    ],
    borrowedAssets: [{ token: "ETH", amount: 0.42, value: Number((0.42 * getTokenPrice("ETH")).toFixed(2)) }],
    collateralValue: 8943.2,
    borrowValue: 1579.2,
    healthFactor: 4.41,
  });

  const proposals = await Proposal.create([
    {
      title: "Expand SOL-USDC emissions for Q2",
      category: "Treasury",
      description: "Increase SOL-USDC liquidity mining allocation by 18% for the next emission cycle.",
      proposerId: admin._id,
      status: "active",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      quorum: 55,
      votesYes: 612,
      votesNo: 188,
      votesAbstain: 44,
    },
    {
      title: "Launch cross-margin beta vaults",
      category: "Protocol Upgrade",
      description: "Enable cross-margin mode for advanced borrowers with a phased rollout.",
      proposerId: admin._id,
      status: "passed",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      quorum: 60,
      votesYes: 908,
      votesNo: 222,
      votesAbstain: 50,
    },
  ]);

  await Vote.create({
    proposalId: proposals[0]._id,
    userId: demoUser._id,
    voteType: "yes",
    votingPower: 1450,
    reward: 18.5,
  });

  await NFT.create([
    {
      mint: nftMintOne,
      name: "Retix Genesis #042",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=900&q=80&auto=format&fit=crop",
      collection: "Retix Genesis",
      owner: demoUser.walletAddress,
      description: "Genesis access collectible for early Retix Wallet users.",
      attributes: [
        { traitType: "Tier", value: "Genesis" },
        { traitType: "Access", value: "Early" },
      ],
    },
    {
      mint: nftMintTwo,
      name: "Blue Ledger #118",
      image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=900&q=80&auto=format&fit=crop",
      collection: "Blue Ledger",
      owner: demoUser.walletAddress,
      description: "Premium ledger-themed collectible with technical neon styling.",
      attributes: [
        { traitType: "Rarity", value: "Rare" },
        { traitType: "Theme", value: "Blue Neon" },
      ],
    },
  ]);

  await AddressBook.create([
    {
      userId: demoUser._id,
      name: "Ops Wallet",
      walletAddress: opsWallet,
      network: "Devnet",
      notes: "Operational settlement wallet",
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      userId: demoUser._id,
      name: "Treasury Vault",
      walletAddress: treasuryWallet,
      network: "Devnet",
      notes: "Protocol treasury cold bucket",
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    },
    {
      userId: demoUser._id,
      name: "OTC Desk",
      walletAddress: otcDeskWallet,
      network: "Devnet",
      notes: "Liquidity rebalancing counterparty",
      lastUsedAt: null,
    },
  ]);

  const treasuryConfig = await TreasuryConfig.create({
    name: "Protocol Treasury",
    wallets: [
      {
        label: "Treasury Vault",
        address: treasuryWallet,
        category: "main",
        notes: "Protocol treasury cold bucket",
      },
      {
        label: "Rewards Treasury",
        address: opsWallet,
        category: "rewards",
        notes: "Reward distribution and validator incentives",
      },
    ],
    categoryRules: [
      { symbol: "USDC", category: "stable reserves", tags: ["stable"] },
      { symbol: "SOL", category: "liquid reserves", tags: ["base asset"] },
      { symbol: "GOV", category: "governance reserves", tags: ["governance"] },
      { symbol: "RTX", category: "reward reserves", tags: ["rewards"] },
      { symbol: "mSOL", category: "protocol-owned liquidity", tags: ["pol"] },
    ],
    monthlyOutflowEstimate: 18000,
    rewardFundingMonthly: 7200,
    grantsCommitmentMonthly: 5400,
  });

  await TreasurySnapshot.create([
    {
      treasuryId: treasuryConfig._id,
      totalValue: 482000,
      tokenBreakdown: [
        { symbol: "SOL", balance: 1680, value: 255360, allocationPercent: 52.98, category: "liquid reserves" },
        { symbol: "USDC", balance: 122000, value: 122000, allocationPercent: 25.31, category: "stable reserves" },
        { symbol: "GOV", balance: 24000, value: 67200, allocationPercent: 13.94, category: "governance reserves" },
        { symbol: "RTX", balance: 550000, value: 19250, allocationPercent: 3.99, category: "reward reserves" },
        { symbol: "mSOL", balance: 110, value: 18190, allocationPercent: 3.77, category: "protocol-owned liquidity" },
      ],
      categoryBreakdown: [
        { category: "liquid reserves", value: 255360, allocationPercent: 52.98 },
        { category: "stable reserves", value: 122000, allocationPercent: 25.31 },
        { category: "governance reserves", value: 67200, allocationPercent: 13.94 },
        { category: "reward reserves", value: 19250, allocationPercent: 3.99 },
        { category: "protocol-owned liquidity", value: 18190, allocationPercent: 3.77 },
      ],
      liquidAssets: 377360,
      committedAssets: 104640,
      inflows: 38200,
      outflows: 24100,
      healthScore: 78,
      recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    },
    {
      treasuryId: treasuryConfig._id,
      totalValue: 496500,
      tokenBreakdown: [
        { symbol: "SOL", balance: 1708, value: 261324, allocationPercent: 52.63, category: "liquid reserves" },
        { symbol: "USDC", balance: 126400, value: 126400, allocationPercent: 25.46, category: "stable reserves" },
        { symbol: "GOV", balance: 25000, value: 70000, allocationPercent: 14.1, category: "governance reserves" },
        { symbol: "RTX", balance: 560000, value: 19600, allocationPercent: 3.95, category: "reward reserves" },
        { symbol: "mSOL", balance: 116, value: 19176, allocationPercent: 3.86, category: "protocol-owned liquidity" },
      ],
      categoryBreakdown: [
        { category: "liquid reserves", value: 261324, allocationPercent: 52.63 },
        { category: "stable reserves", value: 126400, allocationPercent: 25.46 },
        { category: "governance reserves", value: 70000, allocationPercent: 14.1 },
        { category: "reward reserves", value: 19600, allocationPercent: 3.95 },
        { category: "protocol-owned liquidity", value: 19176, allocationPercent: 3.86 },
      ],
      liquidAssets: 387724,
      committedAssets: 108776,
      inflows: 44150,
      outflows: 26340,
      healthScore: 81,
      recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
  ]);

  await TreasuryEvent.create([
    {
      treasuryId: treasuryConfig._id,
      type: "proposal-passed",
      title: "Liquidity incentives refill approved",
      description: "Treasury-funded reward reserve increase approved through governance.",
      relatedProposal: "liquidity-incentives-refill",
      token: "RTX",
      amount: 150000,
      impact: "medium",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      treasuryId: treasuryConfig._id,
      type: "treasury-transfer",
      title: "Stable reserve rebalance",
      description: "USDC moved into primary treasury wallet to improve reserve runway.",
      token: "USDC",
      amount: 24000,
      impact: "low",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
  ]);

  await Transaction.create([
    {
      userId: demoUser._id,
      type: "Deposit",
      token: "USDC",
      amount: 5000,
      status: "completed",
      network: "Devnet",
      metadata: { source: "Bank transfer" },
    },
    {
      userId: demoUser._id,
      type: "Stake",
      token: "SOL",
      amount: stakes[0].amount,
      status: "completed",
      network: "Devnet",
      metadata: { stakeId: stakes[0]._id.toString(), lockPeriodId: lockPeriods[2]._id.toString() },
    },
    {
      userId: demoUser._id,
      type: "Rewards Claim",
      token: "STRK",
      amount: 2.45,
      status: "completed",
      network: "Devnet",
      metadata: { stakeId: stakes[1]._id.toString() },
    },
    {
      userId: demoUser._id,
      type: "Unstake",
      token: "SOL",
      amount: 12.4,
      status: "completed",
      network: "Devnet",
      metadata: { note: "Partial historical unstake" },
    },
    {
      userId: demoUser._id,
      type: "Token Transfer",
      token: "GOV",
      amount: 120,
      status: "pending",
      network: "Devnet",
      metadata: { destination: "DAO escrow" },
    },
    {
      userId: demoUser._id,
      type: "Sent SOL",
      token: "SOL",
      amount: 0.24,
      receiver: opsWallet,
      signature: createPublicKey(),
      status: "completed",
      network: "Devnet",
      metadata: { walletAddress: demoUser.walletAddress, walletModule: true, provider: "Retix Wallet", confidenceScore: 93, riskLevel: "Safe" },
    },
    {
      userId: demoUser._id,
      type: "Received SOL",
      token: "SOL",
      amount: 1.1,
      receiver: demoUser.walletAddress,
      signature: createPublicKey(),
      status: "completed",
      network: "Devnet",
      metadata: { walletAddress: demoUser.walletAddress, walletModule: true, provider: "Phantom", confidenceScore: 96, riskLevel: "Safe" },
    },
    {
      userId: demoUser._id,
      type: "Airdrop",
      token: "SOL",
      amount: 1.5,
      receiver: demoUser.walletAddress,
      signature: createPublicKey(),
      status: "completed",
      network: "Devnet",
      metadata: { walletAddress: demoUser.walletAddress, walletModule: true, provider: "Retix Wallet", confidenceScore: 99, riskLevel: "Safe" },
    },
    {
      userId: demoUser._id,
      type: "Swap",
      token: "USDC",
      amount: 46.23,
      receiver: demoUser.walletAddress,
      status: "completed",
      network: "Devnet",
      metadata: {
        walletAddress: demoUser.walletAddress,
        walletModule: true,
        provider: "Retix Wallet",
        simulated: true,
        fromToken: "SOL",
        toToken: "USDC",
        amountIn: 0.31,
        amountOut: 46.23,
        confidenceScore: 92,
        riskLevel: "Safe",
      },
    },
    {
      userId: demoUser._id,
      type: "NFT Transfer",
      token: "NFT",
      amount: 1,
      receiver: demoUser.walletAddress,
      status: "pending",
      network: "Devnet",
      metadata: {
        walletAddress: demoUser.walletAddress,
        walletModule: true,
        provider: "Backpack",
        nftName: "Retix Genesis #042",
        mint: nftMintOne,
        confidenceScore: 68,
        riskLevel: "Suspicious",
      },
    },
    {
      userId: demoUser._id,
      type: "Token Creation",
      token: "RTX",
      amount: 1000000,
      receiver: mintAddress,
      signature: createPublicKey(),
      status: "completed",
      network: "Devnet",
      metadata: {
        walletAddress: demoUser.walletAddress,
        walletModule: true,
        provider: "Retix Wallet",
        mintAddress,
        name: "Retix Token",
        symbol: "RTX",
        decimals: 9,
        confidenceScore: 94,
        riskLevel: "Safe",
      },
    },
  ]);

  await SecurityCheck.create([
    {
      walletAddress: demoUser.walletAddress,
      receiverAddress: opsWallet,
      riskLevel: "Safe",
      confidence: 91,
      warnings: ["Known operational contact found in your address book."],
    },
    {
      walletAddress: demoUser.walletAddress,
      receiverAddress: treasuryWallet,
      riskLevel: "Suspicious",
      confidence: 84,
      warnings: ["Transfer size exceeded recent average wallet behavior."],
    },
  ]);

  await WalletScore.create({
    walletAddress: demoUser.walletAddress,
    score: 86,
    riskLevel: "Safe",
    recommendations: [
      "Avoid interacting with unknown tokens unless the contract has been verified.",
      "Maintain address verification for large treasury-bound transfers.",
    ],
    metrics: {
      unknownTokenInteractions: 0,
      largeTransactionSpikes: 1,
      suspiciousInteractions: 1,
      failedTransactions: 0,
      walletAgeDays: 42,
      transactionConsistency: 81,
      addressBookCoverage: 3,
    },
  });

  await AIAdvice.create({
    userId: demoUser._id,
    portfolioSnapshot: {
      totalValue: 35240.12,
      dominantAsset: "SOL",
      dominantAllocation: 58.2,
    },
    recommendations: [
      "SOL dominance is elevated. Rebalancing 15-20% into USDC can reduce wallet volatility.",
      "Keep BONK exposure tactical rather than core due to high beta behavior.",
    ],
    riskLevel: "Medium",
    portfolioInsights: [
      "Portfolio breadth is healthy, but volatility remains concentrated in SOL and BONK.",
      "Stablecoin coverage is sufficient for short-term optionality but could be improved further.",
    ],
    confidence: 87,
  });

  await Watchlist.create({
    userId: demoUser._id,
    items: [
      { symbol: "BTC", coinId: "bitcoin" },
      { symbol: "ETH", coinId: "ethereum" },
      { symbol: "SOL", coinId: "solana" },
      { symbol: "BONK", coinId: "bonk" },
    ],
  });

  await Alert.create([
    {
      userId: demoUser._id,
      walletAddress: demoUser.walletAddress,
      type: "price",
      target: "BTC",
      condition: "above",
      threshold: 100000,
      enabled: true,
    },
    {
      userId: demoUser._id,
      walletAddress: demoUser.walletAddress,
      type: "protocol",
      target: "staking_rewards",
      condition: "available",
      threshold: 0,
      enabled: true,
    },
  ]);

  await GovernanceMetadata.create(
    proposals.map((proposal) => ({
      proposalPubkey: proposal._id.toString(),
      title: proposal.title,
      summary: proposal.description.slice(0, 120),
      markdownDescription: `# ${proposal.title}\n\n${proposal.description}\n\n- Category: ${proposal.category}\n- Source: mirrored governance metadata`,
      tags: [proposal.category.toLowerCase(), "governance"],
      category: proposal.category,
      authorWallet: admin.walletAddress,
      attachments: [],
      treasuryRequest:
        proposal.category === "Treasury"
          ? {
              amount: 45000,
              token: "USDC",
              category: "ecosystem grants",
              destination: "Rewards treasury",
              impact: "medium impact",
              conditions: "Execute after quorum, admin multisig confirmation, and 24h timelock.",
            }
          : undefined,
    })),
  );

  const marketSeeds = [
    { symbol: "BTC", coinId: "bitcoin", price: 99768.28, marketCap: 1965000000000, volume24h: 52300000000, change1h: -0.12, change24h: -0.54, change7d: 4.42 },
    { symbol: "ETH", coinId: "ethereum", price: 5342.14, marketCap: 642000000000, volume24h: 24800000000, change1h: 0.08, change24h: 1.14, change7d: 6.21 },
    { symbol: "SOL", coinId: "solana", price: getTokenPrice("SOL"), marketCap: 93200000000, volume24h: 6400000000, change1h: 0.32, change24h: 4.2, change7d: 9.4 },
  ];

  await MarketPriceSnapshot.create(
    marketSeeds.map((entry) => ({
      ...entry,
      fetchedAt: new Date(),
    })),
  );

  await PortfolioSnapshot.create([
    {
      walletAddress: demoUser.walletAddress,
      userId: demoUser._id,
      totalValue: 35240.12,
      totalInvested: 28750.22,
      pnl: 6489.9,
      tokenBreakdown: [
        { symbol: "SOL", amount: 96, price: getTokenPrice("SOL"), value: Number((96 * getTokenPrice("SOL")).toFixed(2)), allocationPercent: 45.8 },
        { symbol: "USDC", amount: 18450, price: 1, value: 18450, allocationPercent: 32.1 },
        { symbol: "RTX", amount: 125000, price: getTokenPrice("RTX"), value: Number((125000 * getTokenPrice("RTX")).toFixed(2)), allocationPercent: 12.4 },
      ],
      takenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      walletAddress: demoUser.walletAddress,
      userId: demoUser._id,
      totalValue: 36892.44,
      totalInvested: 28750.22,
      pnl: 8142.22,
      tokenBreakdown: [
        { symbol: "SOL", amount: 96, price: getTokenPrice("SOL"), value: Number((96 * getTokenPrice("SOL")).toFixed(2)), allocationPercent: 47.3 },
        { symbol: "USDC", amount: 18450, price: 1, value: 18450, allocationPercent: 31.2 },
        { symbol: "RTX", amount: 125000, price: getTokenPrice("RTX"), value: Number((125000 * getTokenPrice("RTX")).toFixed(2)), allocationPercent: 11.8 },
      ],
      takenAt: new Date(),
    },
  ]);

  const mirroredTransactions = await Transaction.find({ userId: demoUser._id, signature: { $exists: true, $ne: null } }).lean();
  if (mirroredTransactions.length > 0) {
    await TransactionMirror.create(
      mirroredTransactions.map((transaction) => ({
        walletAddress: transaction.metadata?.walletAddress || demoUser.walletAddress,
        userId: demoUser._id,
        signature: transaction.signature,
        type: transaction.type,
        protocolModule: transaction.type === "Swap" ? "liquidity" : transaction.type === "Token Creation" ? "token" : "wallet",
        tokenSymbol: transaction.token,
        amount: transaction.amount,
        fromAddress: transaction.metadata?.walletAddress || demoUser.walletAddress,
        toAddress: transaction.receiver || "",
        status: transaction.status,
        slot: 0,
        blockTime: transaction.createdAt,
        explorerUrl: `https://explorer.solana.com/tx/${transaction.signature}?cluster=devnet`,
        metadata: {
          ...(transaction.metadata || {}),
          source: "seed-mirror",
        },
      })),
    );
  }

  await ProtocolHealthSnapshot.create({
    stakingActive: true,
    liquidityActive: true,
    lendingActive: true,
    governanceActive: true,
    rpcLatency: 482,
    syncStatus: "healthy",
    lastIndexerRun: new Date(),
    totalProtocolTx: mirroredTransactions.length,
  });

  await JobRunLog.create([
    {
      jobName: "sync-market-prices",
      status: "success",
      details: { synced: marketSeeds.length },
      startedAt: new Date(Date.now() - 1000 * 60 * 15),
      finishedAt: new Date(Date.now() - 1000 * 60 * 14),
    },
    {
      jobName: "sync-transactions",
      status: "success",
      details: { synced: mirroredTransactions.length },
      startedAt: new Date(Date.now() - 1000 * 60 * 10),
      finishedAt: new Date(Date.now() - 1000 * 60 * 9),
    },
  ]);

  await AdminLog.create([
    {
      adminId: admin._id,
      adminUserId: admin._id,
      adminWallet: admin.walletAddress,
      action: "Seeded Protocol Settings",
      module: "admin",
      entityType: "AdminSetting",
      severity: "info",
      notes: "Initial demo environment bootstrapped.",
    },
    {
      adminId: admin._id,
      adminUserId: admin._id,
      adminWallet: admin.walletAddress,
      action: "Updated Lock Period",
      module: "staking",
      entityType: "LockPeriod",
      entityId: lockPeriods[2]._id.toString(),
      oldValue: { apy: 17.25 },
      newValue: { apy: 18.75 },
      severity: "warning",
      notes: "Raised 90 day lock period APY during simulation seed.",
    },
  ]);

  await PublicWalletProfile.create([
    {
      userId: admin._id,
      walletAddress: admin.walletAddress,
      displayName: "Ava Admin",
      avatar: admin.avatar,
      bio: "Protocol operator tracking staking policy, governance execution, and ecosystem treasury exposure.",
      tags: ["governance participant", "whale", "staker"],
      visibility: "public",
      isDiscoverable: true,
      showInLeaderboards: true,
      showInTrending: true,
    },
    {
      userId: demoUser._id,
      walletAddress: demoUser.walletAddress,
      displayName: "Ray Solis",
      avatar: demoUser.avatar,
      bio: "Balanced multi-strategy operator with staking, liquidity, and governance activity across SolanaBlocks surfaces.",
      tags: ["trader", "liquidity provider", "staker"],
      visibility: "public",
      isDiscoverable: true,
      showInLeaderboards: true,
      showInTrending: true,
    },
  ]);

  await WalletFollow.create([
    {
      followerUserId: admin._id,
      followedWalletAddress: demoUser.walletAddress,
    },
    {
      followerUserId: demoUser._id,
      followedWalletAddress: admin.walletAddress,
    },
  ]);

  await SharedPortfolioSnapshot.create([
    {
      userId: demoUser._id,
      walletAddress: demoUser.walletAddress,
      title: "Weekly Alpha Snapshot",
      timeframe: "7D",
      visibility: "public",
      summaryData: {
        portfolioValue: 36892.44,
        pnl: 8142.22,
        topAssets: [
          { symbol: "SOL", allocationPercent: 47.3 },
          { symbol: "USDC", allocationPercent: 31.2 },
          { symbol: "RTX", allocationPercent: 11.8 },
        ],
        riskScore: 74,
      },
    },
  ]);

  await WalletBadge.create([
    {
      walletAddress: demoUser.walletAddress,
      badgeKey: "top-staker",
      badgeLabel: "Top Staker",
      reason: "Strong active staking footprint across the latest mirror window.",
    },
    {
      walletAddress: demoUser.walletAddress,
      badgeKey: "liquidity-expert",
      badgeLabel: "Liquidity Expert",
      reason: "Consistent LP exposure and fee generation.",
    },
    {
      walletAddress: admin.walletAddress,
      badgeKey: "governance-voice",
      badgeLabel: "Governance Voice",
      reason: "Leads proposal flow and protocol parameter reviews.",
    },
  ]);

  await WalletLeaderboardSnapshot.create([
    {
      category: "top-staker",
      walletAddress: demoUser.walletAddress,
      metricValue: 248.5,
      rank: 1,
      period: "7d",
      movement: "new",
    },
    {
      category: "most-followed-wallet",
      walletAddress: demoUser.walletAddress,
      metricValue: 1,
      rank: 1,
      period: "7d",
      movement: "new",
    },
  ]);
}
