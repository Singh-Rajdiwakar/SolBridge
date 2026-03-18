import { AddressBook } from "../models/AddressBook.js";
import { AdminLog } from "../models/AdminLog.js";
import { GovernanceMetadata } from "../models/GovernanceMetadata.js";
import { MarketPriceSnapshot } from "../models/MarketPriceSnapshot.js";
import { Proposal } from "../models/Proposal.js";
import { Token } from "../models/Token.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { TreasuryConfig } from "../models/TreasuryConfig.js";
import { TreasuryEvent } from "../models/TreasuryEvent.js";
import { TreasurySnapshot } from "../models/TreasurySnapshot.js";
import {
  buildExplorerAddressUrl,
  buildExplorerUrl,
  getBalance,
  getParsedTokenAccounts,
} from "./solana.service.js";

const STABLECOINS = new Set(["USDC", "USDT", "DAI", "USDS", "PYUSD"]);
const GOVERNANCE_TOKENS = new Set(["GOV", "RTX"]);
const RANGE_DAYS = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "1Y": 365,
  ALL: null,
};

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shortAddress(address = "") {
  return address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "--";
}

function getHealthLabel(score) {
  if (score >= 82) return "Strong";
  if (score >= 66) return "Healthy";
  if (score >= 48) return "Moderate";
  if (score >= 28) return "Weak";
  return "Critical";
}

function isTreasuryProposal(proposal, metadata) {
  const category = String(proposal?.category || metadata?.category || "").toLowerCase();
  const tags = (metadata?.tags || []).map((tag) => String(tag).toLowerCase());
  const title = `${proposal?.title || ""} ${metadata?.title || ""}`.toLowerCase();

  return (
    category.includes("treasury") ||
    tags.some((tag) => ["treasury", "grants", "incentives", "liquidity", "rewards"].includes(tag)) ||
    /grant|treasury|reward|incentive|diversif|liquidity/.test(title)
  );
}

function inferAssetCategory(symbol, walletCategory, categoryRule) {
  if (categoryRule) {
    return categoryRule.category;
  }

  if (STABLECOINS.has(symbol)) return "stable reserves";
  if (GOVERNANCE_TOKENS.has(symbol)) return "governance reserves";
  if (walletCategory === "rewards") return "reward reserves";
  if (walletCategory === "liquidity") return "protocol-owned liquidity";
  if (walletCategory === "grants" || walletCategory === "operations") return "ecosystem incentives";
  return "liquid reserves";
}

function buildCategoryBreakdown(tokenBreakdown, totalValue) {
  const categories = new Map();

  for (const token of tokenBreakdown) {
    categories.set(token.category, (categories.get(token.category) || 0) + token.value);
  }

  return Array.from(categories.entries())
    .map(([category, value]) => ({
      category,
      value: round(value, 2),
      allocationPercent: totalValue ? round((value / totalValue) * 100, 2) : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function buildInsights(tokenBreakdown, categoryBreakdown, totalValue) {
  const topAsset = tokenBreakdown[0];
  const stableValue = categoryBreakdown
    .filter((item) => item.category === "stable reserves")
    .reduce((sum, item) => sum + item.value, 0);
  const polValue = categoryBreakdown
    .filter((item) => item.category === "protocol-owned liquidity")
    .reduce((sum, item) => sum + item.value, 0);

  const insights = [];
  if (topAsset && topAsset.allocationPercent >= 38) {
    insights.push(`Treasury is heavily concentrated in ${topAsset.symbol}.`);
  }
  if (stableValue > 0) {
    insights.push(
      `Stablecoin reserves provide ${round((stableValue / Math.max(totalValue, 1)) * 100, 1)}% downside protection.`,
    );
  }
  if (polValue > totalValue * 0.24) {
    insights.push("Protocol-owned liquidity exposure is high relative to liquid reserves.");
  }
  if (insights.length === 0) {
    insights.push("Treasury allocation remains balanced across the visible reserve mix.");
  }
  return insights;
}

async function resolveTreasuryConfig() {
  const existing = await TreasuryConfig.findOne({ isActive: true }).sort({ updatedAt: -1 }).lean();
  if (existing) {
    return existing;
  }

  const inferredWallets = await AddressBook.find({
    $or: [{ name: /treasury/i }, { notes: /treasury/i }],
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  if (inferredWallets.length === 0) {
    return null;
  }

  return {
    _id: "inferred-treasury",
    name: "Protocol Treasury",
    wallets: inferredWallets.map((wallet) => ({
      label: wallet.name,
      address: wallet.walletAddress,
      category: /reward/i.test(wallet.name) ? "rewards" : "main",
      notes: wallet.notes || "",
    })),
    categoryRules: [
      { symbol: "USDC", category: "stable reserves", tags: ["stable"] },
      { symbol: "GOV", category: "governance reserves", tags: ["governance"] },
      { symbol: "RTX", category: "reward reserves", tags: ["reward"] },
      { symbol: "mSOL", category: "liquid reserves", tags: ["staked"] },
    ],
    monthlyOutflowEstimate: 18000,
    rewardFundingMonthly: 7200,
    grantsCommitmentMonthly: 5400,
    isActive: true,
    inferred: true,
  };
}

async function getPriceMaps() {
  const [tokens, marketSnapshots] = await Promise.all([
    Token.find().lean(),
    MarketPriceSnapshot.find().sort({ fetchedAt: -1 }).lean(),
  ]);

  const symbolPrice = new Map();
  for (const token of tokens) {
    if (!symbolPrice.has(token.symbol)) {
      symbolPrice.set(token.symbol, {
        price: Number(token.price || 0),
        mintAddress: token.mintAddress || "",
        name: token.name || token.symbol,
        icon: token.icon || token.symbol.slice(0, 2),
        change24h: Number(token.change24h || 0),
      });
    }
  }

  for (const snapshot of marketSnapshots) {
    const current = symbolPrice.get(snapshot.symbol);
    if (current?.__fromMarket) {
      continue;
    }

    symbolPrice.set(snapshot.symbol, {
      ...(current || {
        mintAddress: "",
        name: snapshot.symbol,
        icon: snapshot.symbol.slice(0, 2),
      }),
      price: Number(snapshot.price || current?.price || 0),
      change24h: Number(snapshot.change24h || current?.change24h || 0),
      __fromMarket: true,
    });
  }

  const mintToSymbol = new Map(
    tokens.filter((token) => token.mintAddress).map((token) => [token.mintAddress, token.symbol]),
  );

  return { symbolPrice, mintToSymbol };
}

async function buildTreasuryState() {
  const config = await resolveTreasuryConfig();
  if (!config) {
    return {
      configured: false,
      config: null,
      wallets: [],
      tokenBreakdown: [],
      categoryBreakdown: [],
      totalValue: 0,
      liquidAssets: 0,
      committedAssets: 0,
      stableReserveRatio: 0,
      governanceTokenRatio: 0,
      idleCapitalRatio: 0,
      deployedCapitalRatio: 0,
      largestAsset: null,
      latestRecordedAt: null,
    };
  }

  const { symbolPrice, mintToSymbol } = await getPriceMaps();
  const walletSummaries = await Promise.all(
    (config.wallets || []).map(async (wallet) => {
      const [solBalance, tokenAccounts] = await Promise.all([
        getBalance(wallet.address).catch(() => ({ sol: 0 })),
        getParsedTokenAccounts(wallet.address).catch(() => []),
      ]);

      const balances = [
        {
          symbol: "SOL",
          balance: round(solBalance.sol, 6),
          walletLabel: wallet.label,
          walletAddress: wallet.address,
          mintAddress: "",
        },
        ...tokenAccounts.map((account) => ({
          symbol: mintToSymbol.get(account.mint) || `TKN-${account.mint.slice(0, 4)}`,
          balance: round(account.amount, 6),
          mintAddress: account.mint,
          walletLabel: wallet.label,
          walletAddress: wallet.address,
        })),
      ];

      const totalValue = balances.reduce((sum, asset) => {
        const info = symbolPrice.get(asset.symbol);
        return sum + asset.balance * Number(info?.price || 0);
      }, 0);

      return {
        label: wallet.label,
        address: wallet.address,
        category: wallet.category,
        notes: wallet.notes || "",
        explorerUrl: buildExplorerAddressUrl(wallet.address),
        totalValue: round(totalValue, 2),
        holdingsCount: balances.filter((asset) => asset.balance > 0).length,
        balances,
      };
    }),
  );

  const aggregated = new Map();
  for (const wallet of walletSummaries) {
    for (const balance of wallet.balances) {
      const current = aggregated.get(balance.symbol) || {
        symbol: balance.symbol,
        balance: 0,
        wallets: new Set(),
        mintAddress: balance.mintAddress || symbolPrice.get(balance.symbol)?.mintAddress || "",
        name: symbolPrice.get(balance.symbol)?.name || balance.symbol,
        icon: symbolPrice.get(balance.symbol)?.icon || balance.symbol.slice(0, 2),
        change24h: symbolPrice.get(balance.symbol)?.change24h || 0,
        walletCategory: wallet.category,
      };
      current.balance += balance.balance;
      current.wallets.add(wallet.address);
      aggregated.set(balance.symbol, current);
    }
  }

  const totalValue = Array.from(aggregated.values()).reduce((sum, token) => {
    const info = symbolPrice.get(token.symbol);
    return sum + token.balance * Number(info?.price || 0);
  }, 0);

  const tokenBreakdown = Array.from(aggregated.values())
    .map((token) => {
      const info = symbolPrice.get(token.symbol) || {};
      const value = token.balance * Number(info.price || 0);
      const categoryRule = (config.categoryRules || []).find((rule) => rule.symbol === token.symbol);
      const category = inferAssetCategory(token.symbol, token.walletCategory, categoryRule);
      return {
        symbol: token.symbol,
        name: token.name,
        icon: token.icon,
        tokenMint: token.mintAddress || "",
        balance: round(token.balance, 6),
        usdValue: round(value, 2),
        allocationPercent: totalValue ? round((value / totalValue) * 100, 2) : 0,
        change24h: Number(info.change24h || 0),
        category,
        walletCount: token.wallets.size,
        tag: STABLECOINS.has(token.symbol)
          ? "stable"
          : GOVERNANCE_TOKENS.has(token.symbol)
            ? "governance"
            : category === "reward reserves"
              ? "reward reserve"
              : "volatile",
        explorerUrl: token.mintAddress ? buildExplorerAddressUrl(token.mintAddress) : "",
      };
    })
    .filter((token) => token.balance > 0 || token.symbol === "SOL")
    .sort((a, b) => b.usdValue - a.usdValue);

  const categoryBreakdown = buildCategoryBreakdown(tokenBreakdown, totalValue);
  const liquidAssets = categoryBreakdown
    .filter((item) => ["liquid reserves", "stable reserves"].includes(item.category))
    .reduce((sum, item) => sum + item.value, 0);
  const committedAssets = Math.max(0, totalValue - liquidAssets);
  const stableReserveRatio = totalValue
    ? round(
        (categoryBreakdown
          .filter((item) => item.category === "stable reserves")
          .reduce((sum, item) => sum + item.value, 0) /
          totalValue) *
          100,
        2,
      )
    : 0;
  const governanceTokenRatio = totalValue
    ? round(
        (categoryBreakdown
          .filter((item) => item.category === "governance reserves")
          .reduce((sum, item) => sum + item.value, 0) /
          totalValue) *
          100,
        2,
      )
    : 0;
  const idleCapitalRatio = totalValue ? round((liquidAssets / totalValue) * 100, 2) : 0;
  const deployedCapitalRatio = totalValue ? round((committedAssets / totalValue) * 100, 2) : 0;

  const latestSnapshot = config.inferred
    ? null
    : await TreasurySnapshot.findOne({ treasuryId: config._id }).sort({ recordedAt: -1 }).lean();

  return {
    configured: true,
    config,
    wallets: walletSummaries,
    tokenBreakdown,
    categoryBreakdown,
    totalValue: round(totalValue, 2),
    liquidAssets: round(liquidAssets, 2),
    committedAssets: round(committedAssets, 2),
    stableReserveRatio,
    governanceTokenRatio,
    idleCapitalRatio,
    deployedCapitalRatio,
    largestAsset: tokenBreakdown[0] || null,
    latestRecordedAt: latestSnapshot?.recordedAt || null,
    insights: buildInsights(tokenBreakdown, categoryBreakdown, totalValue),
  };
}

async function buildTreasuryHealth(state) {
  const stableRatio = state.stableReserveRatio / 100;
  const topAssetRatio = (state.tokenBreakdown[0]?.allocationPercent || 0) / 100;
  const totalValue = Math.max(state.totalValue, 1);
  const commitments = (state.config?.rewardFundingMonthly || 0) + (state.config?.grantsCommitmentMonthly || 0);
  const liquidCoverage = state.liquidAssets / totalValue;
  const deployedRatio = state.deployedCapitalRatio / 100;
  const governanceRatio = state.governanceTokenRatio / 100;

  const score = clamp(
    Math.round(
      78 +
        stableRatio * 20 +
        liquidCoverage * 18 -
        topAssetRatio * 26 -
        deployedRatio * 12 -
        governanceRatio * 8 -
        (commitments > state.liquidAssets * 0.25 ? 12 : 0),
    ),
    8,
    96,
  );

  const explanations = [];
  if (stableRatio >= 0.2) explanations.push("Treasury has healthy stable reserves.");
  if (topAssetRatio >= 0.42) explanations.push("Large concentration in one asset reduces resilience.");
  if (commitments > state.liquidAssets * 0.25) explanations.push("Reward distribution obligations may pressure runway.");
  if (liquidCoverage >= 0.45) explanations.push("Liquid reserve coverage is strong relative to committed capital.");

  return {
    score,
    label: getHealthLabel(score),
    stableReserveStrength: stableRatio >= 0.25 ? "Strong" : stableRatio >= 0.12 ? "Moderate" : "Thin",
    concentrationRisk: topAssetRatio >= 0.42 ? "Elevated" : topAssetRatio >= 0.28 ? "Managed" : "Low",
    liquidReserveSufficiency: liquidCoverage >= 0.4 ? "Comfortable" : liquidCoverage >= 0.22 ? "Watch" : "Tight",
    rewardRunwayPressure: commitments > state.liquidAssets * 0.25 ? "Watch" : "Nominal",
    governanceDependency: governanceRatio >= 0.22 ? "High" : governanceRatio >= 0.12 ? "Moderate" : "Low",
    spendingVelocity: commitments > 0 ? round((commitments / totalValue) * 100, 2) : 0,
    explanations,
  };
}

async function buildTreasuryRunway(state) {
  const monthlyOutflow = Number(state.config?.monthlyOutflowEstimate || 0);
  const rewardFunding = Number(state.config?.rewardFundingMonthly || 0);
  const grantsCommitment = Number(state.config?.grantsCommitmentMonthly || 0);
  const stableReserves = state.categoryBreakdown
    .filter((item) => item.category === "stable reserves")
    .reduce((sum, item) => sum + item.value, 0);
  const totalRunwayMonths = monthlyOutflow > 0 ? round(state.totalValue / monthlyOutflow, 1) : 0;
  const stableRunwayMonths = monthlyOutflow > 0 ? round(stableReserves / monthlyOutflow, 1) : 0;

  return {
    monthlyOutflowEstimate: round(monthlyOutflow, 2),
    rewardFundingMonthly: round(rewardFunding, 2),
    grantsCommitmentMonthly: round(grantsCommitment, 2),
    stableReserveRunwayMonths: stableRunwayMonths,
    totalReserveRunwayMonths: totalRunwayMonths,
    warning:
      stableRunwayMonths > 0 && stableRunwayMonths < 6
        ? "Stable reserve runway is short relative to current commitments."
        : totalRunwayMonths > 0 && totalRunwayMonths < 12
          ? "Treasury runway should be monitored closely if outflows accelerate."
          : "Current runway remains within a manageable range.",
  };
}

async function getTreasuryMetadataMap() {
  const metadata = await GovernanceMetadata.find().lean();
  const byTitle = new Map();
  const byPubkey = new Map();

  for (const item of metadata) {
    byTitle.set(String(item.title || "").toLowerCase(), item);
    byPubkey.set(String(item.proposalPubkey || ""), item);
  }

  return { byTitle, byPubkey };
}

async function buildTreasuryProposals() {
  const [proposals, metadataMap] = await Promise.all([
    Proposal.find().populate("proposerId", "name walletAddress").sort({ createdAt: -1 }).lean(),
    getTreasuryMetadataMap(),
  ]);

  return proposals
    .filter((proposal) => {
      const metadata =
        metadataMap.byPubkey.get(String(proposal._id)) ||
        metadataMap.byTitle.get(String(proposal.title || "").toLowerCase());
      return isTreasuryProposal(proposal, metadata);
    })
    .slice(0, 8)
    .map((proposal) => {
      const metadata =
        metadataMap.byPubkey.get(String(proposal._id)) ||
        metadataMap.byTitle.get(String(proposal.title || "").toLowerCase());
      const requestedAmount = Number(metadata?.treasuryRequest?.amount || 0);
      const requestedToken = metadata?.treasuryRequest?.token || "USDC";
      const treasuryImpact =
        metadata?.treasuryRequest?.impact ||
        (requestedAmount >= 50000 ? "high impact" : requestedAmount >= 15000 ? "medium impact" : "low impact");
      const totalVotes = Number(proposal.votesYes || 0) + Number(proposal.votesNo || 0) + Number(proposal.votesAbstain || 0);

      return {
        id: String(proposal._id),
        title: proposal.title,
        category: metadata?.treasuryRequest?.category || proposal.category,
        requestedAmount,
        requestedToken,
        targetAllocation: metadata?.treasuryRequest?.destination || "Treasury allocation update",
        status: proposal.status,
        proposer: proposal.proposerId?.name || "Unknown proposer",
        summary: metadata?.summary || proposal.description,
        treasuryImpact,
        executionConditions: metadata?.treasuryRequest?.conditions || "Execute after successful vote and quorum.",
        quorumProgress: proposal.quorum ? round((totalVotes / proposal.quorum) * 100, 2) : 0,
        deadline: proposal.endDate,
        explorerUrl: "",
      };
    });
}

async function buildTreasuryFlows(state) {
  const walletAddresses = state.wallets.map((wallet) => wallet.address);
  if (walletAddresses.length === 0) {
    return { monthly: [], recentEvents: [], inflowTotal: 0, outflowTotal: 0 };
  }

  const transactions = await TransactionMirror.find({
    $or: [
      { walletAddress: { $in: walletAddresses } },
      { fromAddress: { $in: walletAddresses } },
      { toAddress: { $in: walletAddresses } },
    ],
  })
    .sort({ blockTime: -1, createdAt: -1 })
    .limit(80)
    .lean();

  const byMonth = new Map();
  let inflowTotal = 0;
  let outflowTotal = 0;

  const recentEvents = transactions.slice(0, 12).map((transaction) => {
    const treasuryInbound =
      walletAddresses.includes(transaction.toAddress) ||
      (walletAddresses.includes(transaction.walletAddress) && /receive|airdrop/i.test(transaction.type));
    const amount = Number(transaction.amount || 0);
    const month = new Date(transaction.blockTime || transaction.createdAt).toISOString().slice(0, 7);
    const current = byMonth.get(month) || { month, inflow: 0, outflow: 0 };
    if (treasuryInbound) {
      current.inflow += amount;
      inflowTotal += amount;
    } else {
      current.outflow += amount;
      outflowTotal += amount;
    }
    byMonth.set(month, current);

    return {
      id: transaction.signature || String(transaction._id),
      type: treasuryInbound ? "inflow" : "outflow",
      title: transaction.type,
      description: `${treasuryInbound ? "Inbound" : "Outbound"} ${transaction.tokenSymbol || "SOL"} movement mirrored from treasury activity.`,
      token: transaction.tokenSymbol || "SOL",
      amount,
      txSignature: transaction.signature || "",
      impact: amount >= 5000 ? "high" : amount >= 1500 ? "medium" : "low",
      createdAt: transaction.blockTime || transaction.createdAt,
      explorerUrl: transaction.explorerUrl || (transaction.signature ? buildExplorerUrl(transaction.signature) : ""),
    };
  });

  return {
    monthly: Array.from(byMonth.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((entry) => ({
        ...entry,
        label: entry.month,
        inflow: round(entry.inflow, 2),
        outflow: round(entry.outflow, 2),
        net: round(entry.inflow - entry.outflow, 2),
      })),
    recentEvents,
    inflowTotal: round(inflowTotal, 2),
    outflowTotal: round(outflowTotal, 2),
  };
}

async function buildTreasuryGrowthSeries(state, range) {
  if (!state?.configured || !state.config) {
    return {
      configured: false,
      range,
      series: [],
      eventMarkers: [],
      source: "not-configured",
    };
  }

  const days = RANGE_DAYS[range];
  const filter = days ? { recordedAt: { $gte: new Date(Date.now() - days * 86400000) } } : {};
  const snapshots = state.config?.inferred
    ? []
    : await TreasurySnapshot.find({ treasuryId: state.config._id, ...filter }).sort({ recordedAt: 1 }).lean();
  const proposals = await buildTreasuryProposals();

  return {
    range,
    series: snapshots.map((snapshot) => ({
      label: new Date(snapshot.recordedAt).toISOString().slice(0, 10),
      value: round(snapshot.totalValue, 2),
      liquidAssets: round(snapshot.liquidAssets || 0, 2),
      committedAssets: round(snapshot.committedAssets || 0, 2),
    })),
    eventMarkers: proposals.slice(0, 4).map((proposal) => ({
      id: proposal.id,
      label: proposal.title,
      date: proposal.deadline,
      impact: proposal.treasuryImpact,
    })),
    source: snapshots.length ? "treasury-snapshot-cache" : "empty",
  };
}

async function buildTreasuryEvents(state, flows, proposals) {
  const storedEvents =
    state.config?.inferred
      ? []
      : await TreasuryEvent.find({ treasuryId: state.config._id }).sort({ createdAt: -1 }).limit(12).lean();
  const adminLogs = await AdminLog.find({
    $or: [{ module: "treasury" }, { action: /treasury/i }, { entityType: /treasury/i }],
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const proposalEvents = proposals.slice(0, 6).map((proposal) => ({
    id: `proposal-${proposal.id}`,
    type: "proposal",
    title: proposal.title,
    description: `${proposal.category} proposal with ${proposal.treasuryImpact}.`,
    token: proposal.requestedToken,
    amount: proposal.requestedAmount,
    impact: proposal.treasuryImpact.includes("high")
      ? "high"
      : proposal.treasuryImpact.includes("medium")
        ? "medium"
        : "low",
    createdAt: proposal.deadline,
    explorerUrl: proposal.explorerUrl,
    relatedProposal: proposal.id,
  }));

  const adminEvents = adminLogs.map((log) => ({
    id: `admin-${log._id}`,
    type: "admin-log",
    title: log.action,
    description: log.notes || `Administrative treasury action recorded under ${log.module || "admin"}.`,
    token: log.newValue?.token || "",
    amount: Number(log.newValue?.amount || 0),
    impact: log.severity === "critical" ? "high" : log.severity === "warning" ? "medium" : "low",
    createdAt: log.createdAt,
    explorerUrl: log.txSignature ? buildExplorerUrl(log.txSignature) : "",
    txSignature: log.txSignature || "",
  }));

  return [...storedEvents, ...flows.recentEvents, ...proposalEvents, ...adminEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 14);
}

function buildRecommendations(state, runway, proposals) {
  const recommendations = [];
  if (state.stableReserveRatio < 18) {
    recommendations.push({
      title: "Increase stable reserves",
      detail: "Treasury stability would improve with a larger stablecoin allocation buffer.",
      priority: "high",
    });
  }
  if ((state.tokenBreakdown[0]?.allocationPercent || 0) > 38) {
    recommendations.push({
      title: "Reduce concentration risk",
      detail: `${state.tokenBreakdown[0]?.symbol || "Top asset"} currently dominates treasury value.`,
      priority: "medium",
    });
  }
  if (runway.stableReserveRunwayMonths > 0 && runway.stableReserveRunwayMonths < 6) {
    recommendations.push({
      title: "Extend stable reserve runway",
      detail: "Current monthly commitments consume stable reserves too quickly.",
      priority: "high",
    });
  }
  if (proposals.some((proposal) => proposal.treasuryImpact === "high impact")) {
    recommendations.push({
      title: "Review high-impact treasury proposals",
      detail: "A pending or recent proposal can materially change allocation and spending posture.",
      priority: "medium",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      title: "Treasury posture remains balanced",
      detail: "Reserve mix, runway, and proposal load currently look manageable.",
      priority: "low",
    });
  }
  return recommendations;
}

export async function getTreasuryOverview() {
  const state = await buildTreasuryState();
  if (!state.configured) {
    return {
      configured: false,
      treasuryName: "DAO Treasury",
      sourceOfTruth: "on-chain balances + mirrored governance metadata",
    };
  }

  const health = await buildTreasuryHealth(state);
  const growth = await buildTreasuryGrowthSeries(state, "30D");
  const proposals = await buildTreasuryProposals();

  return {
    configured: true,
    treasuryName: state.config.name,
    sourceOfTruth: "on-chain treasury balances + off-chain analytics cache",
    totalTreasuryValue: state.totalValue,
    treasuryTokenCount: state.tokenBreakdown.length,
    liquidAssets: state.liquidAssets,
    committedAssets: state.committedAssets,
    change24h:
      growth.series.length >= 2
        ? round(
            ((growth.series[growth.series.length - 1].value - growth.series[growth.series.length - 2].value) /
              Math.max(growth.series[growth.series.length - 2].value, 1)) *
              100,
            2,
          )
        : 0,
    trend30d:
      growth.series.length >= 2
        ? round(
            ((growth.series[growth.series.length - 1].value - growth.series[0].value) /
              Math.max(growth.series[0].value, 1)) *
              100,
            2,
          )
        : 0,
    treasuryHealthScore: health.score,
    treasuryHealthLabel: health.label,
    stablecoinRatio: state.stableReserveRatio,
    governanceTokenRatio: state.governanceTokenRatio,
    idleCapitalRatio: state.idleCapitalRatio,
    deployedCapitalRatio: state.deployedCapitalRatio,
    largestAsset: state.largestAsset,
    activeSpendingProposals: proposals.filter((proposal) => proposal.status === "active").length,
    wallets: state.wallets.map((wallet) => ({
      label: wallet.label,
      address: wallet.address,
      shortAddress: shortAddress(wallet.address),
      category: wallet.category,
      value: wallet.totalValue,
      holdingsCount: wallet.holdingsCount,
      explorerUrl: wallet.explorerUrl,
      notes: wallet.notes,
    })),
    latestRecordedAt: state.latestRecordedAt,
    insights: state.insights,
  };
}

export async function getTreasuryAssets() {
  const state = await buildTreasuryState();
  return {
    configured: state.configured,
    assets: state.tokenBreakdown,
    wallets: state.wallets,
    latestRecordedAt: state.latestRecordedAt,
  };
}

export async function getTreasuryAllocation() {
  const state = await buildTreasuryState();
  return {
    configured: state.configured,
    tokenAllocation: state.tokenBreakdown.map((token) => ({
      symbol: token.symbol,
      value: token.usdValue,
      allocationPercent: token.allocationPercent,
      category: token.category,
    })),
    categoryAllocation: state.categoryBreakdown,
    concentrationWarning:
      (state.tokenBreakdown[0]?.allocationPercent || 0) >= 38
        ? `${state.tokenBreakdown[0]?.symbol || "Top asset"} dominates treasury allocation.`
        : "",
    largestAsset: state.largestAsset,
    insights: state.insights,
  };
}

export async function getTreasuryGrowth(range = "30D") {
  const state = await buildTreasuryState();
  if (!state.configured) {
    return {
      configured: false,
      range,
      series: [],
      eventMarkers: [],
      source: "not-configured",
    };
  }

  return buildTreasuryGrowthSeries(state, range);
}

export async function getTreasuryHealth() {
  const state = await buildTreasuryState();
  if (!state.configured) {
    return { configured: false };
  }

  const health = await buildTreasuryHealth(state);
  const runway = await buildTreasuryRunway(state);
  const proposals = await buildTreasuryProposals();

  return {
    configured: true,
    ...health,
    recommendations: buildRecommendations(state, runway, proposals),
  };
}

export async function getTreasuryRunway() {
  const state = await buildTreasuryState();
  if (!state.configured) {
    return { configured: false };
  }

  return {
    configured: true,
    ...(await buildTreasuryRunway(state)),
  };
}

export async function getTreasurySpendingProposals() {
  return {
    proposals: await buildTreasuryProposals(),
  };
}

export async function getTreasuryFlows() {
  const state = await buildTreasuryState();
  if (!state.configured) {
    return { configured: false, monthly: [], recentEvents: [], inflowTotal: 0, outflowTotal: 0 };
  }

  return {
    configured: true,
    ...(await buildTreasuryFlows(state)),
  };
}

export async function getTreasuryEvents() {
  const state = await buildTreasuryState();
  if (!state.configured) {
    return { configured: false, events: [] };
  }

  const proposals = await buildTreasuryProposals();
  const flows = await buildTreasuryFlows(state);

  return {
    configured: true,
    events: await buildTreasuryEvents(state, flows, proposals),
  };
}
