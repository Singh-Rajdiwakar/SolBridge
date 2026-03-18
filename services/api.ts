import axios from "axios";

import { useAuthStore } from "@/store/auth-store";
import type {
  AdminLog,
  AdminSettings,
  AssistantHistoryResponse,
  AssistantSummaryResponse,
  AiPortfolioAdviceResponse,
  AddressBookEntry,
  ApiEnvelope,
  AuthResponse,
  UserPreferencesResponse,
  UserProfileResponse,
  UserWatchlistResponse,
  GasOptimizationResponse,
  AlertRecord,
  AdminJobRunRecord,
  AdminSummaryResponse,
  DashboardSummaryResponse,
  ExplorerBlockResult,
  ExplorerTokenResult,
  ExplorerTransactionFlow,
  ExplorerTransactionResult,
  ExplorerWalletGraph,
  ExplorerWalletResult,
  CrossWalletActivityResponse,
  CrossWalletDiversityResponse,
  CrossWalletExportResponse,
  CrossWalletPnLResponse,
  CrossWalletRiskResponse,
  CrossWalletSummaryResponse,
  CrossWalletWhaleSignalsResponse,
  TrackedWalletGroupRecord,
  GovernanceAnalyticsRecord,
  RiskBreakdownResponse,
  RiskEventsResponse,
  RiskRecommendationsResponse,
  RiskScenario,
  RiskStressTestResponse,
  RiskSummaryResponse,
  RiskTrendResponse,
  RiskRange,
  LendingMarket,
  LendingAnalyticsRecord,
  LendingPosition,
  LiquidityAnalyticsRecord,
  LiquidityPosition,
  LockPeriod,
  MarketCoinDetail,
  MarketCoinsResponse,
  MarketCurrency,
  MarketChartResponse,
  MarketMoversResponse,
  MarketOverviewResponse,
  MarketProfitLossResponse,
  MarketWatchlist,
  Pool,
  Proposal,
  SecurityAlert,
  SharedPortfolioSnapshotRecord,
  SocialBadgeRecord,
  SocialFollowingResponse,
  SocialLeaderboardCategory,
  SocialProfileRecord,
  SocialSearchResult,
  SocialTrendingWallet,
  SecurityCheckResponse,
  StakeOverview,
  StakeRecord,
  StakingAnalyticsRecord,
  TradingAlert,
  TradingCandlesResponse,
  TradingCompareResponse,
  TradingInterval,
  TradingMarketStats,
  TradingSimulationResponse,
  TradingSymbol,
  TradingTickerResponse,
  TradingWorkspace,
  TransactionRecord,
  MirroredTransactionsResponse,
  TreasuryAllocationResponse,
  TreasuryAssetsResponse,
  TreasuryEventsResponse,
  TreasuryFlowsResponse,
  TreasuryGrowthResponse,
  TreasuryHealthResponse,
  TreasuryOverviewResponse,
  TreasuryProposalsResponse,
  TreasuryRunwayResponse,
  TaxCapitalGainsResponse,
  TaxExportResponse,
  TaxLendingIncomeResponse,
  TaxStakingIncomeResponse,
  TaxSummaryResponse,
  TaxYearlyReportResponse,
  StrategyComparisonResponse,
  StrategyPlanRecord,
  StrategySimulationResponse,
  TransactionSimulationResponse,
  User,
  VoteRecord,
  WalletAccount,
  WalletAnalyticsRecord,
  WalletBalanceResponse,
  WalletInsightsResponse,
  WalletNft,
  WalletPortfolioResponse,
  WalletRiskScoreResponse,
  WalletSwapResponse,
  WalletTransactionListResponse,
  PortfolioSnapshotRecord,
  ProtocolHealthSnapshotRecord,
  NetworkHealthResponse,
  NetworkMetricSeriesResponse,
  NetworkOverviewResponse,
  NetworkStatusEventsResponse,
} from "@/types";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
const shouldUseLocalProxy =
  !configuredApiUrl ||
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/api)?\/?$/i.test(configuredApiUrl);

const api = axios.create({
  baseURL: shouldUseLocalProxy ? "/api/proxy" : configuredApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const apiMessage = error.response?.data?.message;
      if (typeof apiMessage === "string" && apiMessage.length > 0) {
        return Promise.reject(new Error(apiMessage));
      }

      if (!error.response) {
        const target = shouldUseLocalProxy ? "/api/proxy" : configuredApiUrl;
        return Promise.reject(
          new Error(`API unreachable. Start the backend server and verify the API target (${target}).`),
        );
      }
    }

    return Promise.reject(error);
  },
);

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export const authApi = {
  register: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<AuthResponse | ApiEnvelope<AuthResponse>>("/auth/register", payload);
    return unwrapData(data);
  },
  login: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<AuthResponse | ApiEnvelope<AuthResponse>>("/auth/login", payload);
    return unwrapData(data);
  },
  logout: async () => {
    const { data } = await api.post<{ message: string } | ApiEnvelope<{ message: string }>>("/auth/logout");
    return unwrapData(data);
  },
  me: async () => {
    const { data } = await api.get<{ user: User } | ApiEnvelope<{ user: User }>>("/auth/me");
    return unwrapData(data).user;
  },
};

export const stakingApi = {
  overview: async (token?: string) => {
    const { data } = await api.get<StakeOverview>("/staking/overview", {
      params: token ? { token } : undefined,
    });
    return data;
  },
  history: async (token?: string) => {
    const { data } = await api.get<StakeRecord[] | TransactionRecord[]>("/staking/history", {
      params: token ? { token } : undefined,
    });
    return data;
  },
  calculate: async (payload: Record<string, number>) => {
    const { data } = await api.post<{ estimatedReward: number; projectedValue: number }>(
      "/staking/calculate",
      payload,
    );
    return data;
  },
  create: async (payload: unknown) => {
    const { data } = await api.post("/staking/create", payload);
    return data;
  },
  claim: async (payload: { stakeId: string }) => {
    const { data } = await api.post("/staking/claim", payload);
    return data;
  },
  unstake: async (payload: { stakeId: string }) => {
    const { data } = await api.post("/staking/unstake", payload);
    return data;
  },
};

export const adminApi = {
  settings: async () => {
    const { data } = await api.get<AdminSettings>("/admin/settings");
    return data;
  },
  updateSettings: async (payload: Partial<AdminSettings>) => {
    const { data } = await api.put<AdminSettings>("/admin/settings", payload);
    return data;
  },
  lockPeriods: async () => {
    const { data } = await api.get<LockPeriod[]>("/admin/lock-periods");
    return data;
  },
  createLockPeriod: async (payload: Partial<LockPeriod>) => {
    const { data } = await api.post<LockPeriod>("/admin/lock-periods", payload);
    return data;
  },
  updateLockPeriod: async (id: string, payload: Partial<LockPeriod>) => {
    const { data } = await api.put<LockPeriod>(`/admin/lock-periods/${id}`, payload);
    return data;
  },
  deleteLockPeriod: async (id: string) => {
    const { data } = await api.delete<{ message: string }>(`/admin/lock-periods/${id}`);
    return data;
  },
  emergencyAction: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/admin/emergency-action", payload);
    return data;
  },
  activityLogs: async (query?: string) => {
    const { data } = await api.get<AdminLog[]>("/admin/activity-logs", {
      params: query ? { query } : undefined,
    });
    return data;
  },
  systemHealth: async () => {
    const { data } = await api.get("/admin/system-health");
    return data;
  },
  users: async () => {
    const { data } = await api.get("/admin/users");
    return data;
  },
};

export const poolsApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<Pool[]>("/pools", { params });
    return data;
  },
  detail: async (id: string) => {
    const { data } = await api.get<Pool>(`/pools/${id}`);
    return data;
  },
  simulate: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/pools/simulate", payload);
    return data;
  },
  addLiquidity: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/pools/add-liquidity", payload);
    return data;
  },
  removeLiquidity: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/pools/remove-liquidity", payload);
    return data;
  },
  positions: async () => {
    const { data } = await api.get<LiquidityPosition[]>("/pools/my-positions");
    return data;
  },
  feeHistory: async () => {
    const { data } = await api.get("/pools/fee-history");
    return data;
  },
};

export const lendingApi = {
  markets: async () => {
    const { data } = await api.get<LendingMarket[]>("/lending/markets");
    return data;
  },
  position: async () => {
    const { data } = await api.get<LendingPosition>("/lending/position");
    return data;
  },
  supply: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/lending/supply", payload);
    return data;
  },
  withdraw: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/lending/withdraw", payload);
    return data;
  },
  borrow: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/lending/borrow", payload);
    return data;
  },
  repay: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/lending/repay", payload);
    return data;
  },
  simulate: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/lending/simulate", payload);
    return data;
  },
  history: async () => {
    const { data } = await api.get<TransactionRecord[]>("/lending/history");
    return data;
  },
};

export const governanceApi = {
  stats: async () => {
    const { data } = await api.get("/governance/stats");
    return data;
  },
  proposals: async (status?: string) => {
    const { data } = await api.get<Proposal[]>("/governance/proposals", {
      params: status ? { status } : undefined,
    });
    return data;
  },
  proposal: async (id: string) => {
    const { data } = await api.get<Proposal>(`/governance/proposals/${id}`);
    return data;
  },
  createProposal: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/governance/proposals", payload);
    return data;
  },
  vote: async (payload: Record<string, unknown>) => {
    const { data } = await api.post("/governance/vote", payload);
    return data;
  },
  myVotes: async () => {
    const { data } = await api.get<VoteRecord[]>("/governance/my-votes");
    return data;
  },
  vesting: async () => {
    const { data } = await api.get("/governance/vesting");
    return data;
  },
  claim: async () => {
    const { data } = await api.post("/governance/claim");
    return data;
  },
};

export const walletApi = {
  balance: async (address: string, provider?: string) => {
    const { data } = await api.get<WalletBalanceResponse | ApiEnvelope<WalletBalanceResponse>>("/wallet/balance", {
      params: {
        address,
        ...(provider ? { provider } : {}),
      },
    });
    const payload = unwrapData(data);
    return {
      ...payload,
      address: payload.address || payload.walletAddress,
      balanceSol: payload.balanceSol ?? payload.solBalance ?? 0,
      usdEstimate: payload.usdEstimate ?? payload.usdValue ?? 0,
      status: "Connected",
    };
  },
  portfolio: async (address: string, provider?: string) => {
    const { data } = await api.get<WalletPortfolioResponse | ApiEnvelope<WalletPortfolioResponse>>("/wallet/portfolio", {
      params: {
        address,
        ...(provider ? { provider } : {}),
      },
    });
    const payload = unwrapData(data);
    return {
      ...payload,
      address: payload.address || payload.walletAddress,
      balanceSol: payload.balanceSol ?? payload.solBalance ?? 0,
      usdEstimate: payload.usdEstimate ?? payload.usdValue ?? 0,
      status: "Connected",
    };
  },
  transactions: async (address?: string, page = 1, limit = 20) => {
    const { data } = await api.get<WalletTransactionListResponse | ApiEnvelope<WalletTransactionListResponse>>("/wallet/transactions", {
      params: {
        ...(address ? { address } : {}),
        page,
        limit,
      },
    });
    const payload = unwrapData(data);
    if (Array.isArray(payload)) {
      return {
        items: payload as unknown as TransactionRecord[],
        pagination: {
          page,
          limit,
          total: (payload as unknown as TransactionRecord[]).length,
          totalPages: 1,
        },
      };
    }
    return payload;
  },
  nfts: async (address: string) => {
    const { data } = await api.get<WalletNft[] | ApiEnvelope<WalletNft[]>>("/wallet/nfts", {
      params: { address },
    });
    return unwrapData(data);
  },
  insights: async (address?: string) => {
    const { data } = await api.get<WalletInsightsResponse | ApiEnvelope<WalletInsightsResponse>>("/wallet/insights", {
      params: address ? { address } : undefined,
    });
    return unwrapData(data);
  },
  account: async () => {
    const { data } = await api.get<WalletAccount | ApiEnvelope<WalletAccount>>("/wallet/account");
    return unwrapData(data);
  },
  send: async (payload: {
    address: string;
    receiver: string;
    amount: number;
    signature: string;
    provider?: string;
    note?: string;
  }) => {
    const { data } = await api.post("/wallet/send", payload);
    return unwrapData(data);
  },
  swap: async (payload: {
    address: string;
    fromToken: string;
    toToken: string;
    amount: number;
    slippage?: number;
    mode?: "preview" | "execute";
    provider?: string;
  }) => {
    const { data } = await api.post<Record<string, unknown> | ApiEnvelope<Record<string, unknown>>>("/wallet/swap", payload);
    const result = unwrapData(data as Record<string, unknown> | ApiEnvelope<Record<string, unknown>>);
    const amount = Number(result.amount ?? payload.amount ?? 0);
    const executionPrice = Number(result.executionPrice ?? result.price ?? 0);
    const amountOut = Number(result.amountOut ?? result.estimatedOutput ?? 0);
    const networkFee = Number(result.networkFee ?? result.fee ?? 0);
    const usdValue = Number(result.usdValue ?? amountOut * executionPrice);

    return {
      fromToken: String(result.fromToken ?? payload.fromToken),
      toToken: String(result.toToken ?? payload.toToken),
      amount,
      amountOut,
      executionPrice,
      slippage: Number(result.slippage ?? payload.slippage ?? 0),
      priceImpact: Number(result.priceImpact ?? 0),
      networkFee,
      usdValue,
      route: typeof result.route === "string" ? result.route : undefined,
      transaction: result.transaction as TransactionRecord | undefined,
    };
  },
  createToken: async (payload: {
    address: string;
    mintAddress: string;
    signature: string;
    name: string;
    symbol: string;
    decimals: number;
    initialSupply: number;
    provider?: string;
  }) => {
    const { data } = await api.post("/wallet/create-token", payload);
    return unwrapData(data);
  },
  airdrop: async (payload: { address: string; amount?: number }) => {
    const { data } = await api.post("/wallet/airdrop", payload);
    return unwrapData(data);
  },
};

export const marketsApi = {
  overview: async (currency: MarketCurrency = "usd") => {
    const { data } = await api.get<MarketOverviewResponse | ApiEnvelope<MarketOverviewResponse>>(
      "/markets/overview",
      { params: { currency } },
    );
    return unwrapData(data);
  },
  coins: async (params?: {
    currency?: MarketCurrency;
    page?: number;
    perPage?: number;
    search?: string;
    ids?: string;
  }) => {
    const { data } = await api.get<MarketCoinsResponse | ApiEnvelope<MarketCoinsResponse>>(
      "/markets/coins",
      { params },
    );
    return unwrapData(data);
  },
  coin: async (id: string, currency: MarketCurrency = "usd") => {
    const { data } = await api.get<MarketCoinDetail | ApiEnvelope<MarketCoinDetail>>(
      `/markets/coin/${id}`,
      { params: { currency } },
    );
    return unwrapData(data);
  },
  chart: async (id: string, range = "7D", currency: MarketCurrency = "usd") => {
    const { data } = await api.get<MarketChartResponse | ApiEnvelope<MarketChartResponse>>(
      `/markets/chart/${id}`,
      { params: { range, currency } },
    );
    return unwrapData(data);
  },
  gainers: async (currency: MarketCurrency = "usd") => {
    const { data } = await api.get<MarketMoversResponse | ApiEnvelope<MarketMoversResponse>>(
      "/markets/gainers",
      { params: { currency } },
    );
    return unwrapData(data);
  },
  losers: async (currency: MarketCurrency = "usd") => {
    const { data } = await api.get<MarketMoversResponse | ApiEnvelope<MarketMoversResponse>>(
      "/markets/losers",
      { params: { currency } },
    );
    return unwrapData(data);
  },
  profitLoss: async (payload: {
    buyPrice: number;
    currentPrice: number;
    quantity: number;
  }) => {
    const { data } = await api.post<MarketProfitLossResponse | ApiEnvelope<MarketProfitLossResponse>>(
      "/markets/profit-loss",
      payload,
    );
    return unwrapData(data);
  },
  watchlist: async () => {
    const { data } = await api.get<MarketWatchlist | ApiEnvelope<MarketWatchlist>>(
      "/markets/watchlist",
    );
    return unwrapData(data);
  },
  saveWatchlist: async (payload: { coinIds: string[]; currency?: MarketCurrency }) => {
    const { data } = await api.post<MarketWatchlist | ApiEnvelope<MarketWatchlist>>(
      "/markets/watchlist",
      payload,
    );
    return unwrapData(data);
  },
};

export const tradingApi = {
  ticker: async (symbols?: TradingSymbol[]) => {
    const { data } = await api.get<TradingTickerResponse | ApiEnvelope<TradingTickerResponse>>(
      "/trading/ticker",
      {
        params: symbols?.length ? { symbols: symbols.join(",") } : undefined,
      },
    );
    return unwrapData(data);
  },
  candles: async (
    symbol: TradingSymbol,
    params?: {
      interval?: TradingInterval;
      limit?: number;
      smaPeriod?: number;
      emaPeriod?: number;
      rsiPeriod?: number;
      macdFast?: number;
      macdSlow?: number;
      macdSignal?: number;
      bbPeriod?: number;
      bbStdDev?: number;
    },
  ) => {
    const { data } = await api.get<TradingCandlesResponse | ApiEnvelope<TradingCandlesResponse>>(
      `/trading/candles/${symbol}`,
      { params },
    );
    return unwrapData(data);
  },
  marketStats: async (symbol: TradingSymbol) => {
    const { data } = await api.get<TradingMarketStats | ApiEnvelope<TradingMarketStats>>(
      `/trading/market-stats/${symbol}`,
    );
    return unwrapData(data);
  },
  watchlist: async () => {
    const { data } = await api.get<TradingWorkspace | ApiEnvelope<TradingWorkspace>>(
      "/trading/watchlist",
    );
    return unwrapData(data);
  },
  saveWatchlist: async (symbols: TradingSymbol[]) => {
    const { data } = await api.post<TradingWorkspace | ApiEnvelope<TradingWorkspace>>(
      "/trading/watchlist",
      { symbols },
    );
    return unwrapData(data);
  },
  alerts: async () => {
    const { data } = await api.get<TradingAlert[] | ApiEnvelope<TradingAlert[]>>("/trading/alerts");
    return unwrapData(data);
  },
  createAlert: async (payload: {
    symbol: TradingSymbol;
    conditionType: "above" | "below" | "smaCross" | "percentDrop";
    targetValue: number;
    indicator?: string;
  }) => {
    const { data } = await api.post<TradingAlert | ApiEnvelope<TradingAlert>>(
      "/trading/alerts",
      payload,
    );
    return unwrapData(data);
  },
  deleteAlert: async (id: string) => {
    const { data } = await api.delete<TradingAlert[] | ApiEnvelope<TradingAlert[]>>(
      `/trading/alerts/${id}`,
    );
    return unwrapData(data);
  },
  simulateTrade: async (payload: {
    symbol: TradingSymbol;
    side: "buy" | "sell";
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    feeRate?: number;
  }) => {
    const { data } = await api.post<TradingSimulationResponse | ApiEnvelope<TradingSimulationResponse>>(
      "/trading/simulate-trade",
      payload,
    );
    return unwrapData(data);
  },
  compare: async (base: TradingSymbol, target: TradingSymbol, interval: TradingInterval) => {
    const { data } = await api.get<TradingCompareResponse | ApiEnvelope<TradingCompareResponse>>(
      "/trading/compare",
      { params: { base, target, interval } },
    );
    return unwrapData(data);
  },
};

export const addressBookApi = {
  list: async () => {
    const { data } = await api.get<AddressBookEntry[] | ApiEnvelope<AddressBookEntry[]>>("/address-book");
    return unwrapData(data);
  },
  create: async (payload: { name: string; walletAddress: string; network?: string; notes?: string }) => {
    const { data } = await api.post<AddressBookEntry | ApiEnvelope<AddressBookEntry>>("/address-book", payload);
    return unwrapData(data);
  },
  update: async (id: string, payload: Partial<{ name: string; walletAddress: string; network: string; notes: string }>) => {
    const { data } = await api.put<AddressBookEntry | ApiEnvelope<AddressBookEntry>>(`/address-book/${id}`, payload);
    return unwrapData(data);
  },
  remove: async (id: string) => {
    const { data } = await api.delete<AddressBookEntry | ApiEnvelope<AddressBookEntry>>(`/address-book/${id}`);
    return unwrapData(data);
  },
};

export const securityApi = {
  checkTransaction: async (payload: {
    walletAddress?: string;
    receiverAddress: string;
    amount: number;
    token: string;
  }) => {
    const { data } = await api.post<SecurityCheckResponse | ApiEnvelope<SecurityCheckResponse>>(
      "/security/check-transaction",
      payload,
    );
    return unwrapData(data);
  },
  walletScore: async (walletAddress?: string) => {
    const { data } = await api.get<WalletRiskScoreResponse | ApiEnvelope<WalletRiskScoreResponse>>(
      "/security/wallet-score",
      {
        params: walletAddress ? { walletAddress } : undefined,
      },
    );
    return unwrapData(data);
  },
  alerts: async (walletAddress?: string) => {
    const { data } = await api.get<SecurityAlert[] | ApiEnvelope<SecurityAlert[]>>(
      "/security/alerts",
      {
        params: walletAddress ? { walletAddress } : undefined,
      },
    );
    return unwrapData(data);
  },
};

export const gasApi = {
  optimize: async (walletAddress?: string) => {
    const { data } = await api.get<GasOptimizationResponse | ApiEnvelope<GasOptimizationResponse>>(
      "/gas/optimize",
      {
        params: walletAddress ? { walletAddress } : undefined,
      },
    );
    return unwrapData(data);
  },
};

export const simulatorApi = {
  transaction: async (payload: {
    kind?: "send" | "swap";
    walletAddress?: string;
    receiverAddress?: string;
    token?: string;
    amount: number;
    fromToken?: string;
    toToken?: string;
    slippage?: number;
  }) => {
    const { data } = await api.post<
      TransactionSimulationResponse | ApiEnvelope<TransactionSimulationResponse>
    >("/simulator/transaction", payload);
    return unwrapData(data);
  },
};

export const aiApi = {
  portfolioAdvice: async (payload: {
    portfolio?: Array<{
      symbol: string;
      balance?: number;
      value?: number;
      price?: number;
      change24h?: number;
    }>;
    tokenBalances?: Array<{
      symbol: string;
      balance?: number;
      value?: number;
      price?: number;
      change24h?: number;
    }>;
    historicalData?: Array<{ label: string; value: number }>;
  }) => {
    const { data } = await api.post<
      AiPortfolioAdviceResponse | ApiEnvelope<AiPortfolioAdviceResponse>
    >("/ai/portfolio-advice", payload);
    return unwrapData(data);
  },
};

export const assistantApi = {
  summary: async (walletAddress: string) => {
    const { data } = await api.get<AssistantSummaryResponse | ApiEnvelope<AssistantSummaryResponse>>(
      `/assistant/summary/${walletAddress}`,
    );
    return unwrapData(data);
  },
  insights: async (walletAddress: string) => {
    const { data } = await api.get<
      { walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["insights"]; source: string } |
      ApiEnvelope<{ walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["insights"]; source: string }>
    >(`/assistant/insights/${walletAddress}`);
    return unwrapData(data);
  },
  yieldSuggestions: async (walletAddress: string) => {
    const { data } = await api.get<
      { walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["yieldSuggestions"]; source: string } |
      ApiEnvelope<{ walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["yieldSuggestions"]; source: string }>
    >(`/assistant/yield-suggestions/${walletAddress}`);
    return unwrapData(data);
  },
  riskWarnings: async (walletAddress: string) => {
    const { data } = await api.get<
      { walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["riskWarnings"]; source: string } |
      ApiEnvelope<{ walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["riskWarnings"]; source: string }>
    >(`/assistant/risk-warnings/${walletAddress}`);
    return unwrapData(data);
  },
  rebalancing: async (walletAddress: string) => {
    const { data } = await api.get<
      { walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["rebalancing"]; source: string } |
      ApiEnvelope<{ walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["rebalancing"]; source: string }>
    >(`/assistant/rebalancing/${walletAddress}`);
    return unwrapData(data);
  },
  opportunities: async (walletAddress: string) => {
    const { data } = await api.get<
      { walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["opportunities"]; source: string } |
      ApiEnvelope<{ walletAddress: string; generatedAt: string; items: AssistantSummaryResponse["opportunities"]; source: string }>
    >(`/assistant/opportunities/${walletAddress}`);
    return unwrapData(data);
  },
  history: async (walletAddress: string) => {
    const { data } = await api.get<AssistantHistoryResponse | ApiEnvelope<AssistantHistoryResponse>>(
      `/assistant/history/${walletAddress}`,
    );
    return unwrapData(data);
  },
  refresh: async (walletAddress: string) => {
    const { data } = await api.post<AssistantSummaryResponse | ApiEnvelope<AssistantSummaryResponse>>(
      `/assistant/refresh/${walletAddress}`,
    );
    return unwrapData(data);
  },
};

export const userApi = {
  profile: async () => {
    const { data } = await api.get<UserProfileResponse | ApiEnvelope<UserProfileResponse>>("/user/profile");
    return unwrapData(data);
  },
  updateProfile: async (payload: {
    name?: string;
    avatar?: string;
    preferredNetwork?: "devnet" | "mainnet-beta" | "testnet";
  }) => {
    const { data } = await api.put<UserProfileResponse | ApiEnvelope<UserProfileResponse>>("/user/profile", payload);
    return unwrapData(data);
  },
  preferences: async () => {
    const { data } = await api.get<UserPreferencesResponse | ApiEnvelope<UserPreferencesResponse>>("/user/preferences");
    return unwrapData(data);
  },
  updatePreferences: async (payload: Partial<UserPreferencesResponse["preferences"]>) => {
    const { data } = await api.put<UserPreferencesResponse | ApiEnvelope<UserPreferencesResponse>>(
      "/user/preferences",
      payload,
    );
    return unwrapData(data);
  },
  watchlist: async () => {
    const { data } = await api.get<UserWatchlistResponse | ApiEnvelope<UserWatchlistResponse>>("/user/watchlist");
    return unwrapData(data);
  },
  addWatchlistItem: async (payload: { symbol: string; coinId: string }) => {
    const { data } = await api.post<UserWatchlistResponse | ApiEnvelope<UserWatchlistResponse>>(
      "/user/watchlist",
      payload,
    );
    return unwrapData(data);
  },
  removeWatchlistItem: async (symbol: string) => {
    const { data } = await api.delete<UserWatchlistResponse | ApiEnvelope<UserWatchlistResponse>>(
      `/user/watchlist/${symbol}`,
    );
    return unwrapData(data);
  },
  linkWallet: async (payload: {
    address: string;
    provider: "retix" | "phantom" | "solflare" | "backpack";
    label?: string;
    notes?: string;
    favorite?: boolean;
    isPrimary?: boolean;
  }) => {
    const { data } = await api.post<UserProfileResponse | ApiEnvelope<UserProfileResponse>>(
      "/user/linked-wallets",
      payload,
    );
    return unwrapData(data);
  },
};

export const alertsApi = {
  list: async () => {
    const { data } = await api.get<AlertRecord[] | ApiEnvelope<AlertRecord[]>>("/alerts");
    return unwrapData(data);
  },
  create: async (payload: {
    walletAddress?: string;
    type: "price" | "protocol" | "security" | "governance";
    target: string;
    condition: string;
    threshold?: number;
    enabled?: boolean;
  }) => {
    const { data } = await api.post<AlertRecord | ApiEnvelope<AlertRecord>>("/alerts", payload);
    return unwrapData(data);
  },
  update: async (id: string, payload: Partial<AlertRecord>) => {
    const { data } = await api.put<AlertRecord | ApiEnvelope<AlertRecord>>(`/alerts/${id}`, payload);
    return unwrapData(data);
  },
  remove: async (id: string) => {
    const { data } = await api.delete<{ id: string; deleted: true } | ApiEnvelope<{ id: string; deleted: true }>>(
      `/alerts/${id}`,
    );
    return unwrapData(data);
  },
};

export const transactionsApi = {
  list: async (params?: {
    walletAddress?: string;
    protocolModule?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<MirroredTransactionsResponse | ApiEnvelope<MirroredTransactionsResponse>>(
      "/transactions",
      { params },
    );
    return unwrapData(data);
  },
  detail: async (signature: string) => {
    const { data } = await api.get<TransactionRecord | ApiEnvelope<TransactionRecord>>(`/transactions/${signature}`);
    return unwrapData(data);
  },
  sync: async (payload: { walletAddress: string; limit?: number }) => {
    const { data } = await api.post<
      { walletAddress: string; synced: number; items: TransactionRecord[]; source: string } |
      ApiEnvelope<{ walletAddress: string; synced: number; items: TransactionRecord[]; source: string }>
    >("/transactions/sync", payload);
    return unwrapData(data);
  },
};

export const portfolioApi = {
  snapshots: async (walletAddress: string) => {
    const { data } = await api.get<PortfolioSnapshotRecord[] | ApiEnvelope<PortfolioSnapshotRecord[]>>(
      `/portfolio/snapshots/${walletAddress}`,
    );
    return unwrapData(data);
  },
  rebuild: async (payload: { walletAddress: string }) => {
    const { data } = await api.post<PortfolioSnapshotRecord | ApiEnvelope<PortfolioSnapshotRecord>>(
      "/portfolio/snapshot/rebuild",
      payload,
    );
    return unwrapData(data);
  },
};

export const strategyApi = {
  list: async () => {
    const { data } = await api.get<StrategyPlanRecord[] | ApiEnvelope<StrategyPlanRecord[]>>("/strategy");
    return unwrapData(data);
  },
  create: async (payload: unknown) => {
    const { data } = await api.post<StrategyPlanRecord | ApiEnvelope<StrategyPlanRecord>>("/strategy", payload);
    return unwrapData(data);
  },
  update: async (strategyId: string, payload: unknown) => {
    const { data } = await api.put<StrategyPlanRecord | ApiEnvelope<StrategyPlanRecord>>(
      `/strategy/${strategyId}`,
      payload,
    );
    return unwrapData(data);
  },
  delete: async (strategyId: string) => {
    const { data } = await api.delete<{ id: string; deleted: true } | ApiEnvelope<{ id: string; deleted: true }>>(
      `/strategy/${strategyId}`,
    );
    return unwrapData(data);
  },
  simulate: async (payload: unknown) => {
    const { data } = await api.post<StrategySimulationResponse | ApiEnvelope<StrategySimulationResponse>>(
      "/strategy/simulate",
      payload,
    );
    return unwrapData(data);
  },
  compare: async (payload: unknown) => {
    const { data } = await api.post<StrategyComparisonResponse | ApiEnvelope<StrategyComparisonResponse>>(
      "/strategy/compare",
      payload,
    );
    return unwrapData(data);
  },
};

export const analyticsApi = {
  wallet: async (walletAddress: string) => {
    const { data } = await api.get<WalletAnalyticsRecord | ApiEnvelope<WalletAnalyticsRecord>>(
      `/analytics/wallet/${walletAddress}`,
    );
    return unwrapData(data);
  },
  staking: async (walletAddress: string) => {
    const { data } = await api.get<StakingAnalyticsRecord | ApiEnvelope<StakingAnalyticsRecord>>(
      `/analytics/staking/${walletAddress}`,
    );
    return unwrapData(data);
  },
  liquidity: async (walletAddress: string) => {
    const { data } = await api.get<LiquidityAnalyticsRecord | ApiEnvelope<LiquidityAnalyticsRecord>>(
      `/analytics/liquidity/${walletAddress}`,
    );
    return unwrapData(data);
  },
  lending: async (walletAddress: string) => {
    const { data } = await api.get<LendingAnalyticsRecord | ApiEnvelope<LendingAnalyticsRecord>>(
      `/analytics/lending/${walletAddress}`,
    );
    return unwrapData(data);
  },
  governance: async (walletAddress: string) => {
    const { data } = await api.get<GovernanceAnalyticsRecord | ApiEnvelope<GovernanceAnalyticsRecord>>(
      `/analytics/governance/${walletAddress}`,
    );
    return unwrapData(data);
  },
  protocol: async () => {
    const { data } = await api.get<AdminSummaryResponse["protocol"] | ApiEnvelope<AdminSummaryResponse["protocol"]>>(
      "/analytics/protocol",
    );
    return unwrapData(data);
  },
};

export const crossWalletApi = {
  groups: async () => {
    const { data } = await api.get<TrackedWalletGroupRecord[] | ApiEnvelope<TrackedWalletGroupRecord[]>>(
      "/cross-wallet/groups",
    );
    return unwrapData(data);
  },
  createGroup: async (payload: { name: string; wallets?: Array<{
    address: string;
    label?: string;
    type: "personal" | "trading" | "staking" | "treasury" | "watch-only";
    notes?: string;
    isFavorite?: boolean;
    isPrimary?: boolean;
  }> }) => {
    const { data } = await api.post<TrackedWalletGroupRecord | ApiEnvelope<TrackedWalletGroupRecord>>(
      "/cross-wallet/groups",
      payload,
    );
    return unwrapData(data);
  },
  updateGroup: async (groupId: string, payload: Partial<{
    name: string;
    wallets: Array<{
      address: string;
      label?: string;
      type: "personal" | "trading" | "staking" | "treasury" | "watch-only";
      notes?: string;
      isFavorite?: boolean;
      isPrimary?: boolean;
    }>;
  }>) => {
    const { data } = await api.put<TrackedWalletGroupRecord | ApiEnvelope<TrackedWalletGroupRecord>>(
      `/cross-wallet/groups/${groupId}`,
      payload,
    );
    return unwrapData(data);
  },
  deleteGroup: async (groupId: string) => {
    const { data } = await api.delete<{ id: string; deleted: true } | ApiEnvelope<{ id: string; deleted: true }>>(
      `/cross-wallet/groups/${groupId}`,
    );
    return unwrapData(data);
  },
  summary: async (groupId: string) => {
    const { data } = await api.get<CrossWalletSummaryResponse | ApiEnvelope<CrossWalletSummaryResponse>>(
      `/cross-wallet/summary/${groupId}`,
    );
    return unwrapData(data);
  },
  pnl: async (groupId: string) => {
    const { data } = await api.get<CrossWalletPnLResponse | ApiEnvelope<CrossWalletPnLResponse>>(
      `/cross-wallet/pnl/${groupId}`,
    );
    return unwrapData(data);
  },
  risk: async (groupId: string) => {
    const { data } = await api.get<CrossWalletRiskResponse | ApiEnvelope<CrossWalletRiskResponse>>(
      `/cross-wallet/risk/${groupId}`,
    );
    return unwrapData(data);
  },
  diversity: async (groupId: string) => {
    const { data } = await api.get<CrossWalletDiversityResponse | ApiEnvelope<CrossWalletDiversityResponse>>(
      `/cross-wallet/diversity/${groupId}`,
    );
    return unwrapData(data);
  },
  activity: async (groupId: string) => {
    const { data } = await api.get<CrossWalletActivityResponse | ApiEnvelope<CrossWalletActivityResponse>>(
      `/cross-wallet/activity/${groupId}`,
    );
    return unwrapData(data);
  },
  whaleSignals: async (groupId: string) => {
    const { data } = await api.get<CrossWalletWhaleSignalsResponse | ApiEnvelope<CrossWalletWhaleSignalsResponse>>(
      `/cross-wallet/whale-signals/${groupId}`,
    );
    return unwrapData(data);
  },
  exportGroup: async (groupId: string, format: "csv" | "json") => {
    const { data } = await api.post<CrossWalletExportResponse | ApiEnvelope<CrossWalletExportResponse>>(
      `/cross-wallet/export/${groupId}`,
      { format },
    );
    return unwrapData(data);
  },
};

export const riskApi = {
  summary: async (walletAddress: string) => {
    const { data } = await api.get<RiskSummaryResponse | ApiEnvelope<RiskSummaryResponse>>(
      `/risk/summary/${walletAddress}`,
    );
    return unwrapData(data);
  },
  breakdown: async (walletAddress: string) => {
    const { data } = await api.get<RiskBreakdownResponse | ApiEnvelope<RiskBreakdownResponse>>(
      `/risk/breakdown/${walletAddress}`,
    );
    return unwrapData(data);
  },
  trend: async (walletAddress: string, range: RiskRange = "30D") => {
    const { data } = await api.get<RiskTrendResponse | ApiEnvelope<RiskTrendResponse>>(
      `/risk/trend/${walletAddress}`,
      { params: { range } },
    );
    return unwrapData(data);
  },
  stressTest: async (payload: { walletAddress?: string; scenario: RiskScenario }) => {
    const { data } = await api.post<RiskStressTestResponse | ApiEnvelope<RiskStressTestResponse>>(
      "/risk/stress-test",
      payload,
    );
    return unwrapData(data);
  },
  events: async (walletAddress: string) => {
    const { data } = await api.get<RiskEventsResponse | ApiEnvelope<RiskEventsResponse>>(
      `/risk/events/${walletAddress}`,
    );
    return unwrapData(data);
  },
  recommendations: async (walletAddress: string) => {
    const { data } = await api.get<RiskRecommendationsResponse | ApiEnvelope<RiskRecommendationsResponse>>(
      `/risk/recommendations/${walletAddress}`,
    );
    return unwrapData(data);
  },
};

export const taxApi = {
  summary: async (
    walletAddress: string,
    params?: {
      year?: number;
      startDate?: string;
      endDate?: string;
      includeProtocols?: string[];
      excludeProtocols?: string[];
      includeTokens?: string[];
      excludeTokens?: string[];
    },
  ) => {
    const { data } = await api.get<TaxSummaryResponse | ApiEnvelope<TaxSummaryResponse>>(
      `/tax/summary/${walletAddress}`,
      { params },
    );
    return unwrapData(data);
  },
  capitalGains: async (
    walletAddress: string,
    params?: {
      year?: number;
      startDate?: string;
      endDate?: string;
      includeProtocols?: string[];
      excludeProtocols?: string[];
      includeTokens?: string[];
      excludeTokens?: string[];
    },
  ) => {
    const { data } = await api.get<TaxCapitalGainsResponse | ApiEnvelope<TaxCapitalGainsResponse>>(
      `/tax/capital-gains/${walletAddress}`,
      { params },
    );
    return unwrapData(data);
  },
  stakingIncome: async (
    walletAddress: string,
    params?: {
      year?: number;
      startDate?: string;
      endDate?: string;
      includeProtocols?: string[];
      excludeProtocols?: string[];
      includeTokens?: string[];
      excludeTokens?: string[];
    },
  ) => {
    const { data } = await api.get<TaxStakingIncomeResponse | ApiEnvelope<TaxStakingIncomeResponse>>(
      `/tax/staking-income/${walletAddress}`,
      { params },
    );
    return unwrapData(data);
  },
  lendingIncome: async (
    walletAddress: string,
    params?: {
      year?: number;
      startDate?: string;
      endDate?: string;
      includeProtocols?: string[];
      excludeProtocols?: string[];
      includeTokens?: string[];
      excludeTokens?: string[];
    },
  ) => {
    const { data } = await api.get<TaxLendingIncomeResponse | ApiEnvelope<TaxLendingIncomeResponse>>(
      `/tax/lending-income/${walletAddress}`,
      { params },
    );
    return unwrapData(data);
  },
  yearlyReport: async (
    walletAddress: string,
    params?: {
      year?: number;
      startDate?: string;
      endDate?: string;
      includeProtocols?: string[];
      excludeProtocols?: string[];
      includeTokens?: string[];
      excludeTokens?: string[];
    },
  ) => {
    const { data } = await api.get<TaxYearlyReportResponse | ApiEnvelope<TaxYearlyReportResponse>>(
      `/tax/yearly-report/${walletAddress}`,
      { params },
    );
    return unwrapData(data);
  },
  yearlyGroupReport: async (
    groupId: string,
    params?: {
      year?: number;
      startDate?: string;
      endDate?: string;
      includeProtocols?: string[];
      excludeProtocols?: string[];
      includeTokens?: string[];
      excludeTokens?: string[];
    },
  ) => {
    const { data } = await api.get<TaxYearlyReportResponse | ApiEnvelope<TaxYearlyReportResponse>>(
      `/tax/group/${groupId}/yearly-report`,
      { params },
    );
    return unwrapData(data);
  },
  exportJson: async (payload: {
    walletAddress?: string;
    groupId?: string;
    year: number;
    startDate?: string;
    endDate?: string;
    includeProtocols?: string[];
    excludeProtocols?: string[];
    includeTokens?: string[];
    excludeTokens?: string[];
  }) => {
    const { data } = await api.post<TaxExportResponse | ApiEnvelope<TaxExportResponse>>("/tax/export/json", payload);
    return unwrapData(data);
  },
  exportCsv: async (payload: {
    walletAddress?: string;
    groupId?: string;
    year: number;
    startDate?: string;
    endDate?: string;
    includeProtocols?: string[];
    excludeProtocols?: string[];
    includeTokens?: string[];
    excludeTokens?: string[];
  }) => {
    const { data } = await api.post<TaxExportResponse | ApiEnvelope<TaxExportResponse>>("/tax/export/csv", payload);
    return unwrapData(data);
  },
  exportPdf: async (payload: {
    walletAddress?: string;
    groupId?: string;
    year: number;
    startDate?: string;
    endDate?: string;
    includeProtocols?: string[];
    excludeProtocols?: string[];
    includeTokens?: string[];
    excludeTokens?: string[];
  }) => {
    const { data } = await api.post<TaxExportResponse | ApiEnvelope<TaxExportResponse>>("/tax/export/pdf", payload);
    return unwrapData(data);
  },
};

export const socialApi = {
  trending: async (limit = 8) => {
    const { data } = await api.get<SocialTrendingWallet[] | ApiEnvelope<SocialTrendingWallet[]>>(
      "/social/trending",
      { params: { limit } },
    );
    return unwrapData(data);
  },
  leaderboards: async (period: "today" | "7d" | "30d" | "all" = "7d") => {
    const { data } = await api.get<SocialLeaderboardCategory[] | ApiEnvelope<SocialLeaderboardCategory[]>>(
      "/social/leaderboards",
      { params: { period } },
    );
    return unwrapData(data);
  },
  profile: async (walletAddress: string) => {
    const { data } = await api.get<SocialProfileRecord | ApiEnvelope<SocialProfileRecord>>(
      `/social/profile/${walletAddress}`,
    );
    return unwrapData(data);
  },
  updateProfile: async (
    walletAddress: string,
    payload: {
      displayName?: string;
      avatar?: string;
      bio?: string;
      tags?: string[];
      visibility?: "private" | "public" | "summary";
      isDiscoverable?: boolean;
      showInLeaderboards?: boolean;
      showInTrending?: boolean;
      visibilitySettings?: Partial<{
        showPortfolioValue: boolean;
        showTokenBalances: boolean;
        showPnl: boolean;
        showNfts: boolean;
        showActivityFeed: boolean;
        showBadges: boolean;
        showSnapshots: boolean;
        showExposure: boolean;
        showRisk: boolean;
      }>;
    },
  ) => {
    const { data } = await api.put<SocialProfileRecord | ApiEnvelope<SocialProfileRecord>>(
      `/social/profile/${walletAddress}`,
      payload,
    );
    return unwrapData(data);
  },
  follow: async (walletAddress: string) => {
    const { data } = await api.post<
      { walletAddress: string; following: boolean; followers: number } |
      ApiEnvelope<{ walletAddress: string; following: boolean; followers: number }>
    >(`/social/follow/${walletAddress}`);
    return unwrapData(data);
  },
  unfollow: async (walletAddress: string) => {
    const { data } = await api.delete<
      { walletAddress: string; following: boolean; followers: number } |
      ApiEnvelope<{ walletAddress: string; following: boolean; followers: number }>
    >(`/social/follow/${walletAddress}`);
    return unwrapData(data);
  },
  following: async () => {
    const { data } = await api.get<SocialFollowingResponse | ApiEnvelope<SocialFollowingResponse>>(
      "/social/following",
    );
    return unwrapData(data);
  },
  feed: async (params?: { walletAddress?: string; scope?: "global" | "wallet" }) => {
    const { data } = await api.get<SocialFollowingResponse["feed"] | ApiEnvelope<SocialFollowingResponse["feed"]>>(
      "/social/feed",
      { params },
    );
    return unwrapData(data);
  },
  shareSnapshot: async (payload: {
    walletAddress: string;
    title: string;
    timeframe?: "24H" | "7D" | "30D" | "90D" | "1Y";
    visibility?: "private" | "public" | "summary";
    includePortfolioValue?: boolean;
    includePnl?: boolean;
    includeAllocation?: boolean;
    includeRiskScore?: boolean;
  }) => {
    const { data } = await api.post<
      SharedPortfolioSnapshotRecord | ApiEnvelope<SharedPortfolioSnapshotRecord>
    >("/social/share-snapshot", payload);
    return unwrapData(data);
  },
  snapshots: async (walletAddress: string) => {
    const { data } = await api.get<
      SharedPortfolioSnapshotRecord[] | ApiEnvelope<SharedPortfolioSnapshotRecord[]>
    >(`/social/snapshots/${walletAddress}`);
    return unwrapData(data);
  },
  search: async (params?: { q?: string; tag?: string; badge?: string; sort?: "trending" | "followers" | "value" }) => {
    const { data } = await api.get<SocialSearchResult[] | ApiEnvelope<SocialSearchResult[]>>(
      "/social/search",
      { params },
    );
    return unwrapData(data);
  },
  badges: async (walletAddress: string) => {
    const { data } = await api.get<SocialBadgeRecord[] | ApiEnvelope<SocialBadgeRecord[]>>(
      `/social/badges/${walletAddress}`,
    );
    return unwrapData(data);
  },
};

export const treasuryApi = {
  overview: async () => {
    const { data } = await api.get<TreasuryOverviewResponse | ApiEnvelope<TreasuryOverviewResponse>>(
      "/treasury/overview",
    );
    return unwrapData(data);
  },
  assets: async () => {
    const { data } = await api.get<TreasuryAssetsResponse | ApiEnvelope<TreasuryAssetsResponse>>(
      "/treasury/assets",
    );
    return unwrapData(data);
  },
  allocation: async () => {
    const { data } = await api.get<TreasuryAllocationResponse | ApiEnvelope<TreasuryAllocationResponse>>(
      "/treasury/allocation",
    );
    return unwrapData(data);
  },
  growth: async (range: "7D" | "30D" | "90D" | "1Y" | "ALL" = "30D") => {
    const { data } = await api.get<TreasuryGrowthResponse | ApiEnvelope<TreasuryGrowthResponse>>(
      "/treasury/growth",
      { params: { range } },
    );
    return unwrapData(data);
  },
  health: async () => {
    const { data } = await api.get<TreasuryHealthResponse | ApiEnvelope<TreasuryHealthResponse>>(
      "/treasury/health",
    );
    return unwrapData(data);
  },
  runway: async () => {
    const { data } = await api.get<TreasuryRunwayResponse | ApiEnvelope<TreasuryRunwayResponse>>(
      "/treasury/runway",
    );
    return unwrapData(data);
  },
  proposals: async () => {
    const { data } = await api.get<TreasuryProposalsResponse | ApiEnvelope<TreasuryProposalsResponse>>(
      "/treasury/proposals",
    );
    return unwrapData(data);
  },
  flows: async () => {
    const { data } = await api.get<TreasuryFlowsResponse | ApiEnvelope<TreasuryFlowsResponse>>(
      "/treasury/flows",
    );
    return unwrapData(data);
  },
  events: async () => {
    const { data } = await api.get<TreasuryEventsResponse | ApiEnvelope<TreasuryEventsResponse>>(
      "/treasury/events",
    );
    return unwrapData(data);
  },
};

export const explorerApi = {
  wallet: async (address: string) => {
    const { data } = await api.get<ExplorerWalletResult | ApiEnvelope<ExplorerWalletResult>>(
      `/explorer/wallet/${address}`,
    );
    return unwrapData(data);
  },
  transaction: async (signature: string) => {
    const { data } = await api.get<ExplorerTransactionResult | ApiEnvelope<ExplorerTransactionResult>>(
      `/explorer/tx/${signature}`,
    );
    return unwrapData(data);
  },
  token: async (mint: string) => {
    const { data } = await api.get<ExplorerTokenResult | ApiEnvelope<ExplorerTokenResult>>(
      `/explorer/token/${mint}`,
    );
    return unwrapData(data);
  },
  block: async (slot: number | string) => {
    const { data } = await api.get<ExplorerBlockResult | ApiEnvelope<ExplorerBlockResult>>(
      `/explorer/block/${slot}`,
    );
    return unwrapData(data);
  },
  walletGraph: async (address: string) => {
    const { data } = await api.get<ExplorerWalletGraph | ApiEnvelope<ExplorerWalletGraph>>(
      `/explorer/graph/wallet/${address}`,
    );
    return unwrapData(data);
  },
  transactionFlow: async (signature: string) => {
    const { data } = await api.get<ExplorerTransactionFlow | ApiEnvelope<ExplorerTransactionFlow>>(
      `/explorer/flow/${signature}`,
    );
    return unwrapData(data);
  },
};

export const networkApi = {
  overview: async (range: "1H" | "24H" | "7D" | "30D" = "24H") => {
    const { data } = await api.get<NetworkOverviewResponse | ApiEnvelope<NetworkOverviewResponse>>(
      "/network/overview",
      { params: { range } },
    );
    return unwrapData(data);
  },
  tps: async (range: "1H" | "24H" | "7D" | "30D" = "24H") => {
    const { data } = await api.get<NetworkMetricSeriesResponse | ApiEnvelope<NetworkMetricSeriesResponse>>(
      "/network/tps",
      { params: { range } },
    );
    return unwrapData(data);
  },
  blockTime: async (range: "1H" | "24H" | "7D" | "30D" = "24H") => {
    const { data } = await api.get<NetworkMetricSeriesResponse | ApiEnvelope<NetworkMetricSeriesResponse>>(
      "/network/block-time",
      { params: { range } },
    );
    return unwrapData(data);
  },
  throughput: async (range: "1H" | "24H" | "7D" | "30D" = "24H") => {
    const { data } = await api.get<NetworkMetricSeriesResponse | ApiEnvelope<NetworkMetricSeriesResponse>>(
      "/network/throughput",
      { params: { range } },
    );
    return unwrapData(data);
  },
  fees: async (range: "1H" | "24H" | "7D" | "30D" = "24H") => {
    const { data } = await api.get<NetworkMetricSeriesResponse | ApiEnvelope<NetworkMetricSeriesResponse>>(
      "/network/fees",
      { params: { range } },
    );
    return unwrapData(data);
  },
  validators: async (range: "1H" | "24H" | "7D" | "30D" = "24H") => {
    const { data } = await api.get<NetworkMetricSeriesResponse | ApiEnvelope<NetworkMetricSeriesResponse>>(
      "/network/validators",
      { params: { range } },
    );
    return unwrapData(data);
  },
  rpcLatency: async (range: "1H" | "24H" | "7D" | "30D" = "24H") => {
    const { data } = await api.get<NetworkMetricSeriesResponse | ApiEnvelope<NetworkMetricSeriesResponse>>(
      "/network/rpc-latency",
      { params: { range } },
    );
    return unwrapData(data);
  },
  health: async (range: "1H" | "24H" | "7D" | "30D" = "24H") => {
    const { data } = await api.get<NetworkHealthResponse | ApiEnvelope<NetworkHealthResponse>>(
      "/network/health",
      { params: { range } },
    );
    return unwrapData(data);
  },
  events: async (limit = 20) => {
    const { data } = await api.get<NetworkStatusEventsResponse | ApiEnvelope<NetworkStatusEventsResponse>>(
      "/network/events",
      { params: { limit } },
    );
    return unwrapData(data);
  },
};

export const dashboardApi = {
  summary: async (walletAddress: string) => {
    const { data } = await api.get<DashboardSummaryResponse | ApiEnvelope<DashboardSummaryResponse>>(
      `/dashboard/summary/${walletAddress}`,
    );
    return unwrapData(data);
  },
  adminSummary: async () => {
    const { data } = await api.get<AdminSummaryResponse | ApiEnvelope<AdminSummaryResponse>>(
      "/dashboard/admin-summary",
    );
    return unwrapData(data);
  },
};

export const adminMonitoringApi = {
  overview: async () => {
    const { data } = await api.get<Record<string, unknown> | ApiEnvelope<Record<string, unknown>>>("/admin/overview");
    return unwrapData(data);
  },
  jobs: async () => {
    const { data } = await api.get<AdminJobRunRecord[] | ApiEnvelope<AdminJobRunRecord[]>>("/admin/jobs");
    return unwrapData(data);
  },
  protocolHealth: async () => {
    const { data } = await api.get<ProtocolHealthSnapshotRecord[] | ApiEnvelope<ProtocolHealthSnapshotRecord[]>>(
      "/admin/protocol-health",
    );
    return unwrapData(data);
  },
};

export default api;
