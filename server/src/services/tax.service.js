import PDFDocument from "pdfkit";

import { LendingMarket } from "../models/LendingMarket.js";
import { MarketPriceSnapshot } from "../models/MarketPriceSnapshot.js";
import { PortfolioSnapshot } from "../models/PortfolioSnapshot.js";
import { Token } from "../models/Token.js";
import { TrackedWalletGroup } from "../models/TrackedWalletGroup.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { getTokenPrice as getFallbackTokenPrice } from "../utils/tokens.js";

const DISPOSITION_TYPES = [/sent/i, /transfer/i, /swap/i, /sell/i];
const ACQUISITION_TYPES = [/deposit/i, /received/i, /airdrop/i, /buy/i, /token creation/i];
const STAKING_INCOME_TYPES = [/reward/i, /staking income/i];
const LENDING_INCOME_TYPES = [/lending reward/i, /interest/i, /yield/i, /incentive/i];

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function normalizeToken(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function monthKey(date) {
  const value = new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [year, month] = key.split("-");
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function toShortAddress(address) {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function reportScopeLabel(scope) {
  if (scope.type === "group") {
    return scope.name;
  }
  return scope.wallets[0]?.label || toShortAddress(scope.wallets[0]?.address || "");
}

function reportFilters(filters) {
  return {
    year: filters.year,
    startDate: filters.startDate,
    endDate: filters.endDate,
    includeProtocols: filters.includeProtocols,
    excludeProtocols: filters.excludeProtocols,
    includeTokens: filters.includeTokens,
    excludeTokens: filters.excludeTokens,
  };
}

async function resolveScope(userId, { walletAddress, groupId }) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (groupId) {
    const group = await TrackedWalletGroup.findOne({ _id: groupId, userId }).lean();
    if (!group) {
      throw new AppError("Tracked wallet group not found", 404);
    }

    return {
      type: "group",
      id: String(group._id),
      name: group.name,
      wallets: group.wallets
        .filter((wallet) => wallet.address)
        .map((wallet) => ({
          address: wallet.address,
          label: wallet.label || toShortAddress(wallet.address),
        })),
    };
  }

  const resolvedWallet = walletAddress || user.walletAddress;
  const allowedWallets = new Set([user.walletAddress, ...(user.linkedWallets || []).map((wallet) => wallet.address)]);

  if (!allowedWallets.has(resolvedWallet)) {
    throw new AppError("Wallet is not linked to this user.", 403);
  }

  const label =
    (user.linkedWallets || []).find((wallet) => wallet.address === resolvedWallet)?.label ||
    (user.walletAddress === resolvedWallet ? "Primary Wallet" : toShortAddress(resolvedWallet));

  return {
    type: "wallet",
    id: resolvedWallet,
    name: label,
    wallets: [{ address: resolvedWallet, label }],
  };
}

function classifyProtocolModule(transaction) {
  const metadataModule = String(transaction.metadata?.protocolModule || "").toLowerCase();
  if (metadataModule) {
    return metadataModule;
  }

  const type = String(transaction.type || "").toLowerCase();
  if (type.includes("stake") || type.includes("reward")) return "staking";
  if (type.includes("supply") || type.includes("borrow") || type.includes("repay") || type.includes("withdraw")) return "lending";
  if (type.includes("liquidity") || type.includes("swap")) return "liquidity";
  if (type.includes("proposal") || type.includes("vote")) return "governance";
  if (type.includes("token")) return "token";
  return "wallet";
}

function isRelevantWalletTransaction(transaction, walletAddresses) {
  const walletAddress = transaction.metadata?.walletAddress;
  if (!walletAddress) {
    return true;
  }
  return walletAddresses.includes(walletAddress);
}

function normalizeFilters(filters) {
  const startDate = filters.startDate || new Date(Date.UTC(filters.year, 0, 1)).toISOString();
  const endDate = filters.endDate || new Date(Date.UTC(filters.year, 11, 31, 23, 59, 59, 999)).toISOString();

  return {
    ...filters,
    startDate,
    endDate,
    includeProtocols: (filters.includeProtocols || []).map((value) => value.toLowerCase()),
    excludeProtocols: (filters.excludeProtocols || []).map((value) => value.toLowerCase()),
    includeTokens: (filters.includeTokens || []).map(normalizeToken),
    excludeTokens: (filters.excludeTokens || []).map(normalizeToken),
  };
}

function applyTransactionFilters(transactions, filters, walletAddresses) {
  const startTime = new Date(filters.startDate).getTime();
  const endTime = new Date(filters.endDate).getTime();

  return transactions.filter((transaction) => {
    const createdAt = new Date(transaction.createdAt).getTime();
    const protocolModule = classifyProtocolModule(transaction);
    const token = normalizeToken(transaction.token);

    if (createdAt < startTime || createdAt > endTime) {
      return false;
    }

    if (!isRelevantWalletTransaction(transaction, walletAddresses)) {
      return false;
    }

    if (filters.includeProtocols.length > 0 && !filters.includeProtocols.includes(protocolModule)) {
      return false;
    }

    if (filters.excludeProtocols.includes(protocolModule)) {
      return false;
    }

    if (filters.includeTokens.length > 0 && !filters.includeTokens.includes(token)) {
      return false;
    }

    if (filters.excludeTokens.includes(token)) {
      return false;
    }

    return true;
  });
}

function buildPriceLookup(snapshots, tokens) {
  const snapshotMap = new Map();
  const tokenMap = new Map(tokens.map((token) => [normalizeToken(token.symbol), token]));

  snapshots.forEach((snapshot) => {
    const symbol = normalizeToken(snapshot.symbol);
    if (!snapshotMap.has(symbol)) {
      snapshotMap.set(symbol, []);
    }
    snapshotMap.get(symbol).push(snapshot);
  });

  snapshotMap.forEach((items) => {
    items.sort((a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime());
  });

  return function getHistoricalPrice(symbol, timestamp) {
    const normalized = normalizeToken(symbol);
    const items = snapshotMap.get(normalized) || [];
    const target = new Date(timestamp).getTime();

    let best = null;
    for (const item of items) {
      if (new Date(item.fetchedAt).getTime() <= target) {
        best = item;
      } else {
        break;
      }
    }

    if (best) {
      return {
        price: Number(best.price || 0),
        source: "historical-cache",
      };
    }

    const latest = items[items.length - 1];
    if (latest) {
      return {
        price: Number(latest.price || 0),
        source: "latest-cache",
      };
    }

    const token = tokenMap.get(normalized);
    if (token?.price) {
      return {
        price: Number(token.price),
        source: "token-catalog",
      };
    }

    return {
      price: Number(getFallbackTokenPrice(normalized) || 0),
      source: "fallback-price-map",
    };
  };
}

async function loadDataset(userId, filters) {
  const scope = await resolveScope(userId, filters);
  const normalizedFilters = normalizeFilters(filters);
  const walletAddresses = scope.wallets.map((wallet) => wallet.address);

  const [transactions, marketSnapshots, tokenCatalog, portfolioSnapshots, lendingMarkets] = await Promise.all([
    Transaction.find({ userId }).sort({ createdAt: 1 }).lean(),
    MarketPriceSnapshot.find({}).sort({ fetchedAt: 1 }).lean(),
    Token.find({}).lean(),
    PortfolioSnapshot.find({ walletAddress: { $in: walletAddresses } }).sort({ takenAt: 1 }).lean(),
    LendingMarket.find({}).lean(),
  ]);

  return {
    scope,
    filters: normalizedFilters,
    walletAddresses,
    transactions: applyTransactionFilters(transactions, normalizedFilters, walletAddresses),
    historicalPrice: buildPriceLookup(marketSnapshots, tokenCatalog),
    portfolioSnapshots,
    lendingMarkets,
  };
}

function createMonthlyAccumulator(year) {
  return Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    return {
      month: key,
      label: monthLabel(key),
      capitalGains: 0,
      stakingIncome: 0,
      lendingIncome: 0,
      taxableEvents: 0,
    };
  });
}

function getOrCreateHolding(holdings, symbol) {
  if (!holdings.has(symbol)) {
    holdings.set(symbol, {
      quantity: 0,
      totalCost: 0,
      earliestAcquiredAt: null,
    });
  }
  return holdings.get(symbol);
}

function buildCapitalGainEvent({
  token,
  disposedAmount,
  disposalValue,
  averageCost,
  eventDate,
  sourceModule,
  txSignature,
  transactionType,
  walletAddress,
}) {
  const costBasis = disposedAmount * averageCost;
  const gainLoss = disposalValue - costBasis;
  return {
    id: `${txSignature || transactionType}-${eventDate}-${token}`,
    walletAddress,
    type: "capital-gain",
    sourceModule,
    label: `${transactionType} ${token}`,
    token,
    amount: round(disposedAmount, 6),
    usdValue: round(disposalValue, 2),
    gainLoss: round(gainLoss, 2),
    txSignature,
    eventDate,
  };
}

function buildIncomeEvent({
  type,
  sourceModule,
  token,
  amount,
  usdValue,
  txSignature,
  eventDate,
  walletAddress,
}) {
  return {
    id: `${type}-${txSignature || walletAddress}-${eventDate}-${token}-${amount}`,
    walletAddress,
    type,
    sourceModule,
    label: `${sourceModule === "staking" ? "Staking" : "Lending"} income`,
    token,
    amount: round(amount, 6),
    usdValue: round(usdValue, 2),
    txSignature,
    eventDate,
  };
}

function aggregateByToken(events) {
  const tokenMap = new Map();

  events.forEach((event) => {
    const current = tokenMap.get(event.token) || {
      token: event.token,
      totalAmount: 0,
      totalUsdValue: 0,
      sources: {},
    };

    current.totalAmount += event.amount;
    current.totalUsdValue += event.usdValue;
    current.sources[event.sourceModule] = (current.sources[event.sourceModule] || 0) + event.usdValue;
    tokenMap.set(event.token, current);
  });

  return Array.from(tokenMap.values())
    .map((item) => ({
      token: item.token,
      totalAmount: round(item.totalAmount, 6),
      totalUsdValue: round(item.totalUsdValue, 2),
      sources: item.sources,
    }))
    .sort((a, b) => b.totalUsdValue - a.totalUsdValue);
}

function buildMonthlyTrends(monthlySummary) {
  return monthlySummary.map((entry) => ({
    label: entry.label,
    capitalGains: round(entry.capitalGains, 2),
    stakingIncome: round(entry.stakingIncome, 2),
    lendingIncome: round(entry.lendingIncome, 2),
    totalTaxableValue: round(entry.capitalGains + entry.stakingIncome + entry.lendingIncome, 2),
    taxableEvents: entry.taxableEvents,
  }));
}

function deriveLendingProtocolName(token, lendingMarkets) {
  const market = lendingMarkets.find((entry) => normalizeToken(entry.token) === normalizeToken(token));
  return market ? `${market.token} Supply Market` : "Lending Protocol";
}

function buildTaxReport(dataset) {
  const holdings = new Map();
  const acquisitionTotals = new Map();
  const capitalRows = new Map();
  const taxableTimeline = [];
  const stakingIncomeEvents = [];
  const lendingIncomeEvents = [];
  const warnings = [];
  const monthlySummary = createMonthlyAccumulator(dataset.filters.year);

  const getMonthEntry = (date) => {
    const key = monthKey(date);
    return monthlySummary.find((entry) => entry.month === key);
  };

  const addAcquisition = (token, amount, totalCost, date) => {
    if (!amount || amount <= 0) {
      return;
    }

    const holding = getOrCreateHolding(holdings, token);
    holding.quantity += amount;
    holding.totalCost += totalCost;
    if (!holding.earliestAcquiredAt) {
      holding.earliestAcquiredAt = date;
    }

    const aggregate = acquisitionTotals.get(token) || { amount: 0, cost: 0, firstAcquiredAt: date };
    aggregate.amount += amount;
    aggregate.cost += totalCost;
    if (!aggregate.firstAcquiredAt || new Date(date).getTime() < new Date(aggregate.firstAcquiredAt).getTime()) {
      aggregate.firstAcquiredAt = date;
    }
    acquisitionTotals.set(token, aggregate);
  };

  const addCapitalDisposition = ({ token, disposedAmount, disposalValue, date, sourceModule, transaction }) => {
    if (!disposedAmount || disposedAmount <= 0) {
      return;
    }

    const holding = getOrCreateHolding(holdings, token);
    const averageCost = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0;
    const realizedCost = averageCost * disposedAmount;
    holding.quantity = Math.max(0, holding.quantity - disposedAmount);
    holding.totalCost = Math.max(0, holding.totalCost - realizedCost);

    if (averageCost === 0) {
      warnings.push(`No historical acquisition cost was available for ${token} on ${new Date(date).toLocaleDateString("en-US")}.`);
    }

    const aggregate = capitalRows.get(token) || {
      token,
      acquiredAmount: round(acquisitionTotals.get(token)?.amount || 0, 6),
      disposedAmount: 0,
      totalCostBasis: 0,
      disposalValue: 0,
      capitalGainLoss: 0,
      firstAcquiredAt: acquisitionTotals.get(token)?.firstAcquiredAt || date,
      lastDisposedAt: date,
    };

    aggregate.disposedAmount += disposedAmount;
    aggregate.totalCostBasis += realizedCost;
    aggregate.disposalValue += disposalValue;
    aggregate.capitalGainLoss += disposalValue - realizedCost;
    aggregate.lastDisposedAt = date;
    capitalRows.set(token, aggregate);

    const event = buildCapitalGainEvent({
      token,
      disposedAmount,
      disposalValue,
      averageCost,
      eventDate: date,
      sourceModule,
      txSignature: transaction.signature,
      transactionType: transaction.type,
      walletAddress: transaction.metadata?.walletAddress || dataset.walletAddresses[0],
    });
    taxableTimeline.push(event);

    const month = getMonthEntry(date);
    if (month) {
      month.capitalGains += event.gainLoss;
      month.taxableEvents += 1;
    }
  };

  const addIncome = ({ module, token, amount, usdValue, date, transaction }) => {
    if (!amount || amount <= 0) {
      return;
    }

    const event = buildIncomeEvent({
      type: module === "staking" ? "staking-income" : "lending-income",
      sourceModule: module,
      token,
      amount,
      usdValue,
      txSignature: transaction.signature,
      eventDate: date,
      walletAddress: transaction.metadata?.walletAddress || dataset.walletAddresses[0],
    });

    taxableTimeline.push(event);
    if (module === "staking") {
      stakingIncomeEvents.push(event);
    } else {
      lendingIncomeEvents.push(event);
    }

    const month = getMonthEntry(date);
    if (month) {
      if (module === "staking") {
        month.stakingIncome += usdValue;
      } else {
        month.lendingIncome += usdValue;
      }
      month.taxableEvents += 1;
    }
  };

  for (const transaction of dataset.transactions) {
    const date = transaction.createdAt;
    const type = String(transaction.type || "");
    const normalizedType = type.toLowerCase();
    const token = normalizeToken(transaction.token);
    const protocolModule = classifyProtocolModule(transaction);

    const priceInfo = dataset.historicalPrice(token, date);
    if (priceInfo.source !== "historical-cache") {
      warnings.push(`Historical price for ${token} on ${new Date(date).toLocaleDateString("en-US")} used ${priceInfo.source}.`);
    }
    const priceAtEvent = Number(priceInfo.price || 0);

    if (matchesAny(normalizedType, ACQUISITION_TYPES)) {
      addAcquisition(token, Number(transaction.amount || 0), Number(transaction.amount || 0) * priceAtEvent, date);
    }

    if (STAKING_INCOME_TYPES.some((pattern) => pattern.test(normalizedType))) {
      const amount = Number(transaction.amount || 0);
      const usdValue = amount * priceAtEvent;
      addIncome({ module: "staking", token, amount, usdValue, date, transaction });
      addAcquisition(token, amount, usdValue, date);
      continue;
    }

    if (matchesAny(normalizedType, LENDING_INCOME_TYPES)) {
      const amount = Number(transaction.amount || 0);
      const usdValue = amount * priceAtEvent;
      addIncome({ module: "lending", token, amount, usdValue, date, transaction });
      addAcquisition(token, amount, usdValue, date);
      continue;
    }

    if (normalizedType.includes("unstake") && Number(transaction.metadata?.pendingReward || 0) > 0) {
      const rewardAmount = Number(transaction.metadata.pendingReward || 0);
      const rewardValue = rewardAmount * priceAtEvent;
      addIncome({ module: "staking", token, amount: rewardAmount, usdValue: rewardValue, date, transaction });
      addAcquisition(token, rewardAmount, rewardValue, date);
    }

    if (normalizedType.includes("swap")) {
      const fromToken = normalizeToken(transaction.metadata?.fromToken || token);
      const toToken = normalizeToken(transaction.metadata?.toToken || transaction.token);
      const amountIn = Number(transaction.metadata?.amountIn || 0);
      const amountOut = Number(transaction.metadata?.amountOut || transaction.amount || 0);
      const toPriceInfo = dataset.historicalPrice(toToken, date);
      const proceeds = amountOut * Number(toPriceInfo.price || 0);

      addCapitalDisposition({
        token: fromToken,
        disposedAmount: amountIn,
        disposalValue: proceeds,
        date,
        sourceModule: protocolModule,
        transaction,
      });
      addAcquisition(toToken, amountOut, proceeds, date);
      continue;
    }

    if (matchesAny(normalizedType, DISPOSITION_TYPES)) {
      const amount = Number(transaction.amount || 0);
      addCapitalDisposition({
        token,
        disposedAmount: amount,
        disposalValue: amount * priceAtEvent,
        date,
        sourceModule: protocolModule,
        transaction,
      });
    }
  }

  const capitalGainsRows = Array.from(capitalRows.values())
    .map((row) => {
      const acquired = acquisitionTotals.get(row.token);
      const holdingPeriodDays = Math.max(
        0,
        Math.round((new Date(row.lastDisposedAt).getTime() - new Date(row.firstAcquiredAt).getTime()) / 86400000),
      );
      return {
        token: row.token,
        acquiredAmount: round(acquired?.amount || row.acquiredAmount, 6),
        disposedAmount: round(row.disposedAmount, 6),
        averageAcquisitionCost: row.disposedAmount > 0 ? round(row.totalCostBasis / row.disposedAmount, 2) : 0,
        disposalValue: round(row.disposalValue, 2),
        capitalGainLoss: round(row.capitalGainLoss, 2),
        holdingPeriodDays,
        holdingPeriodLabel: holdingPeriodDays >= 365 ? "Long-Term" : "Short-Term",
      };
    })
    .sort((a, b) => b.capitalGainLoss - a.capitalGainLoss);

  const totalCapitalGains = capitalGainsRows.filter((row) => row.capitalGainLoss > 0).reduce((sum, row) => sum + row.capitalGainLoss, 0);
  const totalCapitalLosses = Math.abs(capitalGainsRows.filter((row) => row.capitalGainLoss < 0).reduce((sum, row) => sum + row.capitalGainLoss, 0));
  const netCapitalGains = capitalGainsRows.reduce((sum, row) => sum + row.capitalGainLoss, 0);
  const totalStakingIncome = stakingIncomeEvents.reduce((sum, event) => sum + event.usdValue, 0);
  const totalLendingIncome = lendingIncomeEvents.reduce((sum, event) => sum + event.usdValue, 0);
  const combinedTaxableActivityTotal = netCapitalGains + totalStakingIncome + totalLendingIncome;
  const incomeByToken = aggregateByToken([...stakingIncomeEvents, ...lendingIncomeEvents]);
  const lendingByToken = aggregateByToken(lendingIncomeEvents);
  const stakingByToken = aggregateByToken(stakingIncomeEvents);
  const monthlyTrend = buildMonthlyTrends(monthlySummary);
  const largestGainThisYear = capitalGainsRows[0] || null;
  const largestLossThisYear =
    capitalGainsRows.slice().sort((a, b) => a.capitalGainLoss - b.capitalGainLoss)[0] || null;
  const largestIncomeSource =
    incomeByToken.slice().sort((a, b) => b.totalUsdValue - a.totalUsdValue)[0] || null;

  const scopeSnapshots = dataset.portfolioSnapshots.filter((snapshot) =>
    dataset.walletAddresses.includes(snapshot.walletAddress),
  );
  const latestSnapshot = scopeSnapshots[scopeSnapshots.length - 1];
  const previousSnapshot = scopeSnapshots[scopeSnapshots.length - 2];
  const currentValue = latestSnapshot?.totalValue || 0;
  const previousValue = previousSnapshot?.totalValue || currentValue;
  const portfolioChange = previousValue
    ? round(((currentValue - previousValue) / previousValue) * 100, 2)
    : 0;

  const summary = {
    scope: {
      type: dataset.scope.type,
      id: dataset.scope.id,
      name: dataset.scope.name,
      wallets: dataset.scope.wallets,
    },
    filters: reportFilters(dataset.filters),
    year: dataset.filters.year,
    generatedAt: new Date().toISOString(),
    currentPortfolioValue: round(currentValue, 2),
    portfolioChange,
    totalCapitalGains: round(totalCapitalGains, 2),
    totalCapitalLosses: round(totalCapitalLosses, 2),
    netCapitalGains: round(netCapitalGains, 2),
    totalStakingIncome: round(totalStakingIncome, 2),
    totalLendingIncome: round(totalLendingIncome, 2),
    combinedTaxableActivityTotal: round(combinedTaxableActivityTotal, 2),
    totalTaxableEvents: taxableTimeline.length,
    largestGainThisYear: largestGainThisYear
      ? { token: largestGainThisYear.token, value: round(largestGainThisYear.capitalGainLoss, 2) }
      : null,
    largestIncomeSource: largestIncomeSource
      ? { token: largestIncomeSource.token, value: round(largestIncomeSource.totalUsdValue, 2) }
      : null,
    topWinningAsset: largestGainThisYear
      ? { token: largestGainThisYear.token, value: round(largestGainThisYear.capitalGainLoss, 2) }
      : null,
    topLosingAsset: largestLossThisYear
      ? { token: largestLossThisYear.token, value: round(largestLossThisYear.capitalGainLoss, 2) }
      : null,
    warnings: Array.from(new Set(warnings)).slice(0, 8),
  };

  return {
    scope: summary.scope,
    filters: summary.filters,
    generatedAt: summary.generatedAt,
    summary,
    capitalGains: {
      scope: summary.scope,
      year: dataset.filters.year,
      summary,
      rows: capitalGainsRows,
      totalGains: round(totalCapitalGains, 2),
      totalLosses: round(totalCapitalLosses, 2),
      netCapitalGains: round(netCapitalGains, 2),
      topWinningAsset: summary.topWinningAsset,
      topLosingAsset: summary.topLosingAsset,
    },
    stakingIncome: {
      scope: summary.scope,
      year: dataset.filters.year,
      summary,
      events: stakingIncomeEvents.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
      totalStakingRewards: round(totalStakingIncome, 2),
      usdEquivalentIncome: round(totalStakingIncome, 2),
      rewardEvents: stakingIncomeEvents.length,
      bestRewardMonth:
        monthlyTrend.slice().sort((a, b) => b.stakingIncome - a.stakingIncome)[0]?.label || null,
      incomeByToken: stakingByToken,
    },
    lendingIncome: {
      scope: summary.scope,
      year: dataset.filters.year,
      summary,
      events: lendingIncomeEvents.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
      totalLendingIncome: round(totalLendingIncome, 2),
      monthlyLendingIncome: monthlyTrend.map((entry) => ({ label: entry.label, value: entry.lendingIncome })),
      protocolBreakdown: lendingByToken.map((item) => ({
        token: item.token,
        protocol: deriveLendingProtocolName(item.token, dataset.lendingMarkets),
        value: item.totalUsdValue,
      })),
      incomeByToken: lendingByToken,
    },
    yearlySummary: {
      year: dataset.filters.year,
      totalCapitalGains: round(netCapitalGains, 2),
      totalStakingIncome: round(totalStakingIncome, 2),
      totalLendingIncome: round(totalLendingIncome, 2),
      combinedTaxableActivityTotal: round(combinedTaxableActivityTotal, 2),
      topActivityTypes: [
        totalCapitalGains > 0 ? "Capital Gains" : null,
        totalStakingIncome > 0 ? "Staking Income" : null,
        totalLendingIncome > 0 ? "Lending Income" : null,
      ].filter(Boolean),
      totalTransactionsAnalyzed: dataset.transactions.length,
      monthly: monthlyTrend,
    },
    monthlyTrend,
    incomeByToken,
    eventTimeline: taxableTimeline
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
      .slice(0, 40),
    disclaimer:
      "This report is informational only and not tax advice. Values are derived from available on-chain activity, mirrored records, and cached market prices. Verify with your local tax requirements.",
  };
}

function toCsv(report) {
  const lines = [
    ["section", "label", "value"].join(","),
    ["summary", "scope", `"${report.scope.name}"`].join(","),
    ["summary", "year", report.summary.year].join(","),
    ["summary", "capitalGains", report.summary.netCapitalGains].join(","),
    ["summary", "stakingIncome", report.summary.totalStakingIncome].join(","),
    ["summary", "lendingIncome", report.summary.totalLendingIncome].join(","),
    ["summary", "taxableEvents", report.summary.totalTaxableEvents].join(","),
    ...report.capitalGains.rows.map((row) =>
      ["capital-gain", row.token, `${row.acquiredAmount}|${row.disposedAmount}|${row.disposalValue}|${row.capitalGainLoss}|${row.holdingPeriodLabel}`].join(","),
    ),
    ...report.stakingIncome.events.map((event) =>
      ["staking-income", event.token, `${event.amount}|${event.usdValue}|${event.eventDate}`].join(","),
    ),
    ...report.lendingIncome.events.map((event) =>
      ["lending-income", event.token, `${event.amount}|${event.usdValue}|${event.eventDate}`].join(","),
    ),
    ...report.yearlySummary.monthly.map((entry) =>
      ["monthly", entry.label, `${entry.capitalGains}|${entry.stakingIncome}|${entry.lendingIncome}|${entry.taxableEvents}`].join(","),
    ),
  ];

  return lines.join("\n");
}

async function buildPdf(report) {
  const doc = new PDFDocument({ margin: 42 });
  const chunks = [];

  return await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#0F172A").fontSize(21).text("Crypto Tax Report", { align: "left" });
    doc.moveDown(0.3);
    doc.fillColor("#334155").fontSize(11).text(`Scope: ${report.scope.name}`);
    doc.text(`Year: ${report.summary.year}`);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString("en-US")}`);
    doc.moveDown(0.8);

    doc.fillColor("#0F172A").fontSize(14).text("Summary");
    doc.moveDown(0.3);
    [
      `Net capital gains: $${report.summary.netCapitalGains.toFixed(2)}`,
      `Staking income: $${report.summary.totalStakingIncome.toFixed(2)}`,
      `Lending income: $${report.summary.totalLendingIncome.toFixed(2)}`,
      `Taxable events: ${report.summary.totalTaxableEvents}`,
      `Largest gain: ${report.summary.largestGainThisYear ? `${report.summary.largestGainThisYear.token} ($${report.summary.largestGainThisYear.value.toFixed(2)})` : "N/A"}`,
      `Largest income source: ${report.summary.largestIncomeSource ? `${report.summary.largestIncomeSource.token} ($${report.summary.largestIncomeSource.value.toFixed(2)})` : "N/A"}`,
    ].forEach((line) => {
      doc.fillColor("#1E293B").fontSize(11).text(line);
    });

    doc.moveDown(0.8);
    doc.fillColor("#0F172A").fontSize(14).text("Capital Gains");
    report.capitalGains.rows.slice(0, 8).forEach((row) => {
      doc.fillColor("#1E293B").fontSize(10).text(
        `${row.token}: disposed ${row.disposedAmount} | disposal $${row.disposalValue.toFixed(2)} | gain/loss $${row.capitalGainLoss.toFixed(2)}`,
      );
    });

    doc.moveDown(0.8);
    doc.fillColor("#0F172A").fontSize(14).text("Income Summary");
    doc.fillColor("#1E293B").fontSize(10);
    doc.text(`Staking reward events: ${report.stakingIncome.rewardEvents}`);
    doc.text(`Lending income events: ${report.lendingIncome.events.length}`);
    doc.text(`Top staking month: ${report.stakingIncome.bestRewardMonth || "N/A"}`);

    doc.moveDown(0.8);
    doc.fillColor("#0F172A").fontSize(14).text("Monthly Summary");
    report.yearlySummary.monthly.slice(0, 12).forEach((entry) => {
      doc.fillColor("#1E293B").fontSize(10).text(
        `${entry.label}: gains $${entry.capitalGains.toFixed(2)} | staking $${entry.stakingIncome.toFixed(2)} | lending $${entry.lendingIncome.toFixed(2)} | events ${entry.taxableEvents}`,
      );
    });

    doc.moveDown(0.8);
    doc.fillColor("#64748B").fontSize(9).text(report.disclaimer);
    doc.end();
  });
}

export async function getYearlyTaxReport(userId, filters) {
  const dataset = await loadDataset(userId, filters);
  return buildTaxReport(dataset);
}

export async function getTaxSummary(userId, filters) {
  const report = await getYearlyTaxReport(userId, filters);
  return {
    ...report.summary,
    scope: report.scope,
    filters: report.filters,
  };
}

export async function getCapitalGainsReport(userId, filters) {
  const report = await getYearlyTaxReport(userId, filters);
  return {
    scope: report.scope,
    year: report.summary.year,
    summary: report.summary,
    ...report.capitalGains,
  };
}

export async function getStakingIncomeReport(userId, filters) {
  const report = await getYearlyTaxReport(userId, filters);
  return {
    scope: report.scope,
    year: report.summary.year,
    summary: report.summary,
    ...report.stakingIncome,
  };
}

export async function getLendingIncomeReport(userId, filters) {
  const report = await getYearlyTaxReport(userId, filters);
  return {
    scope: report.scope,
    year: report.summary.year,
    summary: report.summary,
    ...report.lendingIncome,
  };
}

export async function exportTaxReport(userId, payload) {
  const report = await getYearlyTaxReport(userId, payload);
  const filenameBase = `${reportScopeLabel(report.scope).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-tax-report-${report.summary.year}`;

  if (payload.format === "csv") {
    return {
      format: "csv",
      filename: `${filenameBase}.csv`,
      mimeType: "text/csv",
      content: toCsv(report),
      generatedAt: report.generatedAt,
    };
  }

  if (payload.format === "pdf") {
    const pdfBuffer = await buildPdf(report);
    return {
      format: "pdf",
      filename: `${filenameBase}.pdf`,
      mimeType: "application/pdf",
      content: pdfBuffer.toString("base64"),
      encoding: "base64",
      generatedAt: report.generatedAt,
    };
  }

  return {
    format: "json",
    filename: `${filenameBase}.json`,
    mimeType: "application/json",
    content: JSON.stringify(report, null, 2),
    generatedAt: report.generatedAt,
  };
}
