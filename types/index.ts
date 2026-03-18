import type { LucideIcon } from "lucide-react";

export type Role = "user" | "admin";

export interface Balance {
  token: string;
  amount: number;
  fiatValue: number;
}

export interface LinkedWallet {
  address: string;
  provider: "retix" | "phantom" | "solflare" | "backpack";
  label?: string;
  notes?: string;
  favorite?: boolean;
  isPrimary?: boolean;
  lastUsedAt?: string | null;
  addedAt?: string;
}

export interface UserPreferences {
  favoriteCoins?: string[];
  chartTimeframe?: "1H" | "24H" | "7D" | "1M" | "3M" | "1Y" | "MAX";
  selectedCurrency?: "usd" | "inr" | "krw";
  sidebarCollapsed?: boolean;
  themeMode?: "dark" | "light" | "system";
  defaultDashboardTab?: string;
  marketView?: string;
  watchlistLayout?: "grid" | "list" | "compact";
  autoRefreshEnabled?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  walletAddress: string;
  avatar?: string;
  balances: Balance[];
  linkedWallets?: LinkedWallet[];
  preferredNetwork?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface StatCardItem {
  title: string;
  value: number;
  change: number;
  chartData: Array<{ value: number }>;
  prefix?: string;
  suffix?: string;
}

export interface StakeOverview {
  stats: StatCardItem[];
  walletBalance: number;
  portfolio: {
    token: string;
    stakedAmount: number;
    fiatValue: number;
    rewardGrowth: number;
    chartData: Array<{ label: string; value: number }>;
  };
  lockPeriods: LockPeriod[];
  transactions: TransactionRecord[];
}

export interface LockPeriod {
  _id: string;
  label: string;
  durationDays: number;
  apy: number;
  minAmount: number;
  penaltyFee: number;
  enabled: boolean;
}

export interface StakeRecord {
  _id: string;
  tokenSymbol: string;
  amount: number;
  apy: number;
  durationDays: number;
  rewardEarned: number;
  claimedReward?: number;
  status: string;
  startedAt: string;
  endsAt: string;
}

export interface TransactionRecord {
  _id: string;
  type: string;
  token: string;
  amount: number;
  status: string;
  receiver?: string;
  signature?: string;
  explorerUrl?: string;
  confidenceScore?: number;
  riskLevel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminSettings {
  _id: string;
  rewardRate: number;
  apyType: string;
  poolActive: boolean;
  maxStakeLimit: number;
  poolCapacity: number;
  earlyWithdrawalFee: number;
  autoCompounding: boolean;
  maintenanceMode: boolean;
  claimsFrozen: boolean;
  withdrawalsFrozen: boolean;
}

export interface AdminLog {
  _id: string;
  adminId?: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  severity?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface Pool {
  _id: string;
  pair: string;
  tokenA: string;
  tokenB: string;
  totalLiquidity: number;
  apr: number;
  volume24h: number;
  feePercent: number;
  priceImpact?: number;
  yourShare: number;
  tvlHistory: Array<{ label: string; value: number }>;
}

export interface LiquidityPosition {
  _id: string;
  poolId: string;
  pair: string;
  amountA: number;
  amountB: number;
  lpTokens: number;
  feesEarned: number;
  apr: number;
}

export interface LendingMarket {
  _id: string;
  token: string;
  supplyApr: number;
  borrowApr: number;
  utilization: number;
  collateralFactor: number;
  totalSupplied: number;
  totalBorrowed: number;
  walletBalance: number;
}

export interface LendingPosition {
  _id: string;
  suppliedAssets: Array<{ token: string; amount: number; value: number }>;
  borrowedAssets: Array<{ token: string; amount: number; value: number }>;
  healthFactor: number;
  collateralValue: number;
  borrowValue: number;
  availableToBorrow: number;
  netApy: number;
  collateralRatio: number;
  liquidationThreshold: number;
}

export interface Proposal {
  _id: string;
  title: string;
  category: string;
  description: string;
  proposerId?: {
    _id: string;
    name: string;
  };
  status: string;
  startDate: string;
  endDate: string;
  quorum: number;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  participation: number;
}

export interface VoteRecord {
  _id: string;
  proposalId: {
    _id: string;
    title: string;
    status: string;
  };
  voteType: string;
  votingPower: number;
  reward: number;
  createdAt: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface ApiErrorShape {
  message: string;
}

export interface WalletTokenBalance {
  symbol: string;
  balance: number;
  usdValue: number;
  change: number;
}

export interface WalletAllocationItem {
  name: string;
  value: number;
}

export interface WalletBalanceHistoryPoint {
  label: string;
  value: number;
}

export interface WalletBalanceResponse {
  address: string;
  walletAddress?: string;
  balanceSol: number;
  solBalance?: number;
  usdEstimate: number;
  usdValue?: number;
  network: string;
  provider: string;
  status: string;
  tokens: WalletTokenBalance[];
}

export interface WalletPortfolioResponse extends WalletBalanceResponse {
  totalPortfolioUsd: number;
  allocation: WalletAllocationItem[];
  balanceHistory: WalletBalanceHistoryPoint[];
}

export interface WalletSendInput {
  receiver: string;
  amount: number;
  note?: string;
}

export interface WalletCreateTokenInput {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
}

export interface WalletSwapInput {
  address: string;
  fromToken: string;
  toToken: string;
  amount: number;
  slippage?: number;
  mode?: "preview" | "execute";
  provider?: string;
}

export interface WalletSwapResponse {
  fromToken: string;
  toToken: string;
  amount: number;
  amountOut: number;
  executionPrice: number;
  slippage: number;
  priceImpact: number;
  networkFee: number;
  usdValue: number;
  route?: string;
  transaction?: TransactionRecord;
}

export interface WalletNftAttribute {
  traitType: string;
  value: string;
}

export interface WalletNft {
  _id?: string;
  mint: string;
  name: string;
  image: string;
  collection: string;
  owner: string;
  description?: string;
  explorerUrl: string;
  attributes: WalletNftAttribute[];
}

export interface AddressBookEntry {
  id: string;
  name: string;
  address: string;
  network?: string;
  notes?: string;
  createdAt?: string;
  lastUsedAt?: string;
}

export interface UserProfileResponse extends User {}

export interface UserPreferencesResponse {
  userId: string;
  preferences: UserPreferences;
  preferredNetwork: string;
}

export interface UserWatchlistItem {
  symbol: string;
  coinId: string;
  addedAt?: string;
}

export interface UserWatchlistResponse {
  userId: string;
  items: UserWatchlistItem[];
}

export interface AlertRecord {
  _id: string;
  userId: string;
  walletAddress?: string;
  type: "price" | "protocol" | "security" | "governance";
  target: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  triggeredAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PortfolioSnapshotToken {
  symbol: string;
  amount: number;
  price: number;
  value: number;
  allocationPercent: number;
}

export interface PortfolioSnapshotRecord {
  _id?: string;
  walletAddress: string;
  userId?: string;
  totalValue: number;
  totalInvested?: number;
  pnl?: number;
  tokenBreakdown: PortfolioSnapshotToken[];
  takenAt: string;
}

export interface MirroredTransactionsResponse {
  items: TransactionRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  source: string;
}

export interface WalletAnalyticsRecord {
  walletAddress: string;
  userId?: string;
  txCount: number;
  totalSent: number;
  totalReceived: number;
  averageTxSize: number;
  mostUsedToken: string;
  walletAgeDays: number;
  series: Array<{ label: string; value: number }>;
  source: string;
}

export interface StakingAnalyticsRecord {
  walletAddress: string;
  totalStaked: number;
  activePositions: number;
  rewardsClaimed: number;
  averageLockDuration: number;
  source: string;
}

export interface LiquidityAnalyticsRecord {
  walletAddress: string;
  liquidityAdded: number;
  liquidityRemoved: number;
  poolParticipation: number;
  swapVolumeMirrored: number;
  source: string;
}

export interface LendingAnalyticsRecord {
  walletAddress: string;
  totalBorrowed: number;
  averageCollateralRatio: number;
  repayments: number;
  riskyPositionsCount: number;
  source: string;
}

export interface GovernanceAnalyticsRecord {
  walletAddress: string;
  proposalCount: number;
  voterTurnout: number;
  quorumHitRate: number;
  userVoteParticipation: number;
  metadataCoverage: number;
  source: string;
}

export interface DashboardSummaryResponse {
  walletAddress: string;
  sourceOfTruth: string;
  walletSummary: {
    owner: string;
    onChainSolBalance: number;
    mirroredAnalytics: WalletAnalyticsRecord;
    latestSnapshots: PortfolioSnapshotRecord[];
    source: string;
  };
  stakingSummary: StakingAnalyticsRecord;
  liquiditySummary: LiquidityAnalyticsRecord;
  lendingSummary: LendingAnalyticsRecord;
  governanceSummary: GovernanceAnalyticsRecord;
  recentMirroredTransactions: TransactionRecord[];
}

export interface AdminSummaryResponse {
  source: string;
  protocol: {
    users: number;
    totalStaked: number;
    activeStakePositions: number;
    liquidityProviders: number;
    totalBorrowed: number;
    proposalCount: number;
    mirroredTransactions: number;
    systemHealth?: ProtocolHealthSnapshotRecord;
    source: string;
  };
  health?: ProtocolHealthSnapshotRecord;
  users: {
    totalUsers: number;
    linkedWalletsCount: number;
  };
  latestAdminActions: AdminLog[];
  rpcLatency?: number | null;
  marketSummary?: Array<{
    symbol: string;
    price?: number;
    marketCap?: number;
    volume24h?: number;
    fetchedAt?: string;
  }>;
}

export interface ProtocolHealthSnapshotRecord {
  _id?: string;
  stakingActive: boolean;
  liquidityActive: boolean;
  lendingActive: boolean;
  governanceActive: boolean;
  rpcLatency: number;
  syncStatus: string;
  lastIndexerRun?: string;
  totalProtocolTx: number;
  createdAt: string;
}

export type TrackedWalletType = "personal" | "trading" | "staking" | "treasury" | "watch-only";

export interface TrackedWalletGroupEntry {
  address: string;
  label?: string;
  type: TrackedWalletType;
  notes?: string;
  isFavorite?: boolean;
  isPrimary?: boolean;
  addedAt?: string;
}

export interface TrackedWalletGroupRecord {
  _id: string;
  userId?: string;
  name: string;
  wallets: TrackedWalletGroupEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CrossWalletSummaryWallet {
  walletAddress: string;
  label: string;
  type: TrackedWalletType;
  notes?: string;
  isFavorite?: boolean;
  isPrimary?: boolean;
  currentValue: number;
  change24h: number;
  pnl: number;
  tokenCount: number;
  txCount: number;
  recentActivity?: string | null;
  risk: {
    score: number;
    label: string;
  };
  diversity: {
    score: number;
    label: string;
    explanation?: string;
  };
  exposures: {
    staking: number;
    liquidity: number;
    lending: number;
    governance: number;
    spot: number;
    lendingRisky?: boolean;
  };
  nftCount: number;
}

export interface CrossWalletSummaryResponse {
  group: {
    id: string;
    name: string;
    wallets: TrackedWalletGroupEntry[];
  };
  walletsTracked: number;
  aggregatedValue: number;
  totalInvested: number;
  totalPnl: number;
  averageRiskScore: number;
  diversityIndex: number;
  whaleFlagCount: number;
  bestPerformer?: {
    walletLabel: string;
    walletAddress: string;
    pnl: number;
  } | null;
  worstPerformer?: {
    walletLabel: string;
    walletAddress: string;
    pnl: number;
  } | null;
  wallets: CrossWalletSummaryWallet[];
  source: string;
}

export interface CrossWalletPnLResponse {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnl: number;
  unrealizedPnl: number;
  realizedPnl: number;
  bestPerformingWallet?: {
    walletLabel: string;
    pnl: number;
  } | null;
  worstPerformingWallet?: {
    walletLabel: string;
    pnl: number;
  } | null;
  trend: Array<{ label: string; shortLabel: string; value: number }>;
  pnlByWallet: Array<{
    walletLabel: string;
    walletAddress: string;
    pnl: number;
    currentValue: number;
    change24h: number;
  }>;
  assetDistribution: Array<{
    name: string;
    value: number;
    allocationPercent: number;
  }>;
  tokenPnl: Array<{
    symbol: string;
    value: number;
    allocationPercent: number;
    wallets: number;
  }>;
  source: string;
}

export interface CrossWalletRiskResponse {
  aggregate: {
    score: number;
    label: string;
    recommendations: string[];
  };
  wallets: Array<{
    walletLabel: string;
    walletAddress: string;
    score: number;
    label: string;
    drivers: {
      topAssetRatio: number;
      stablecoinRatio: number;
      borrowRatio: number;
      liquidityRatio: number;
      failedRatio: number;
    };
  }>;
  source: string;
}

export interface CrossWalletDiversityResponse {
  aggregate: {
    score: number;
    label: string;
    explanation: string;
    uniqueTokens: number;
    stablecoinRatio: number;
    topAssetRatio: number;
    activeExposureBuckets: number;
  };
  wallets: Array<{
    walletLabel: string;
    walletAddress: string;
    score: number;
    label: string;
    explanation: string;
  }>;
  source: string;
}

export interface CrossWalletActivityResponse {
  timeline: Array<{
    walletAddress: string;
    walletLabel: string;
    signature?: string;
    type: string;
    protocolModule?: string;
    amount: number;
    tokenSymbol: string;
    status: string;
    explorerUrl?: string;
    createdAt: string;
  }>;
  heatmap: Array<{
    walletAddress: string;
    walletLabel: string;
    cells: Array<{
      key: string;
      label: string;
      count: number;
    }>;
  }>;
  activitySummary: Array<{
    walletLabel: string;
    walletAddress: string;
    txCount: number;
    recentActivity?: string | null;
    volume: number;
    largeMovements: number;
  }>;
  source: string;
}

export interface CrossWalletWhaleSignalsResponse {
  topBalanceWallet?: {
    walletLabel: string;
    walletAddress: string;
    totalValue: number;
  } | null;
  topVolumeWallet?: {
    walletLabel: string;
    walletAddress: string;
    volume: number;
  } | null;
  topTransaction?: {
    walletLabel: string;
    walletAddress: string;
    amount: number;
    tokenSymbol: string;
    signature?: string;
    explorerUrl?: string;
    createdAt: string;
    type: string;
  } | null;
  flags: Array<{
    walletAddress: string;
    walletLabel: string;
    severity: string;
    title: string;
    description: string;
  }>;
  source: string;
}

export interface CrossWalletExportResponse {
  format: "csv" | "json";
  filename: string;
  content: string;
}

export type RiskRange = "7D" | "30D" | "90D" | "1Y";
export type RiskScenario =
  | "sol-drop-10"
  | "sol-drop-20"
  | "lp-divergence-15"
  | "borrowed-asset-up-10"
  | "stable-buffer";

export interface RiskCategoryScore {
  key: "volatility" | "borrow" | "liquidity" | "concentration";
  label: string;
  score: number;
}

export interface RiskProtocolExposureItem {
  key: string;
  label: string;
  value: number;
  percentage: number;
}

export interface RiskRecommendation {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
}

export interface RiskEventRecord {
  id: string;
  eventType: string;
  description: string;
  severity: string;
  relatedAsset?: string;
  createdAt: string;
}

export interface RiskSummaryResponse {
  walletAddress: string;
  totalRiskScore: number;
  riskLabel: string;
  explanationSummary: string;
  majorContributor: string;
  trendDirection: string;
  whatChangedThisWeek: string;
  resilienceInsight: string;
  thresholds: {
    lowRiskMax: number;
    moderateRiskMax: number;
    highRiskMax: number;
    criticalRiskMin: number;
    safeHealthFactor: number;
    highLpExposurePercent: number;
    highConcentrationPercent: number;
    riskyDebtRatioPercent: number;
  };
  categoryScores: {
    volatility: number;
    borrow: number;
    liquidity: number;
    concentration: number;
  };
  borrowMetrics: {
    healthFactor: number | null;
    debtToCollateralRatio: number;
    liquidationWarningLevel: string;
  };
  protocolExposure: RiskProtocolExposureItem[];
  source: string;
}

export interface RiskBreakdownResponse {
  walletAddress: string;
  totalRiskScore: number;
  riskLabel: string;
  categories: RiskCategoryScore[];
  volatility: {
    score: number;
    label: string;
    contributionPercent: number;
    stablecoinRatio: number;
    topVolatileAssets: Array<{
      symbol: string;
      allocationPercent: number;
      volatilityScore: number;
    }>;
    explanation: string;
  };
  borrow: {
    score: number;
    label: string;
    healthFactor: number | null;
    liquidationWarningLevel: string;
    debtToCollateralRatio: number;
    recommendedSafeZone: string;
    explanation: string;
    borrowedShare: number;
  };
  liquidity: {
    score: number;
    label: string;
    portfolioInPoolsPercent: number;
    ilRiskLabel: string;
    estimatedImpermanentLossPressure: number;
    protocolConcentrationPercent: number;
    topRiskyPools: Array<{
      pair: string;
      value: number;
      riskIndex: number;
      isVolatilePair: boolean;
    }>;
    explanation: string;
  };
  concentration: {
    score: number;
    label: string;
    largestAssetPercent: number;
    top3AssetsPercent: number;
    diversificationLabel: string;
    explanation: string;
  };
  protocolExposure: RiskProtocolExposureItem[];
  source: string;
}

export interface RiskTrendResponse {
  walletAddress: string;
  range: RiskRange;
  trendDirection: string;
  whatChangedThisWeek: string;
  series: Array<{
    label: string;
    date: string;
    totalRiskScore: number;
    volatilityRisk: number;
    borrowRisk: number;
    liquidityRisk: number;
    concentrationRisk: number;
  }>;
  eventMarkers: Array<{
    id: string;
    label: string;
    severity: string;
    date: string;
  }>;
  source: string;
}

export interface RiskStressTestResponse {
  walletAddress: string;
  scenario: {
    key: RiskScenario;
    label: string;
    description: string;
  };
  baseline: {
    totalRiskScore: number;
    riskLabel: string;
    healthFactor: number | null;
    projectedPortfolioValue: number;
    categoryScores: {
      volatility: number;
      borrow: number;
      liquidity: number;
      concentration: number;
    };
  };
  result: {
    totalRiskScore: number;
    riskLabel: string;
    projectedPortfolioValue: number;
    pnlImpactPercent: number;
    healthFactor: number | null;
    categoryScores: {
      volatility: number;
      borrow: number;
      liquidity: number;
      concentration: number;
    };
  };
  source: string;
}

export interface RiskEventsResponse {
  walletAddress: string;
  events: RiskEventRecord[];
  source: string;
}

export interface RiskRecommendationsResponse {
  walletAddress: string;
  recommendations: RiskRecommendation[];
  majorContributor: string;
  resilienceInsight: string;
  source: string;
}

export type ExplorerSearchType = "wallet" | "transaction" | "token" | "block";

export interface ExplorerProtocolExposure {
  module: "staking" | "liquidity" | "lending" | "governance";
  label: string;
  activityCount: number;
}

export interface ExplorerCounterparty {
  address: string;
  shortAddress: string;
  label: string;
  tag: string;
  txCount: number;
  totalVolume: number;
  latestInteractionAt?: string | null;
  explorerUrl: string;
}

export interface ExplorerRecentTransaction {
  signature: string;
  shortSignature: string;
  slot: number;
  blockTime?: string | null;
  status: string;
  protocolModule: string;
  type: string;
  amount: number;
  tokenSymbol: string;
  explorerUrl: string;
}

export interface ExplorerWalletResult {
  queryType: "wallet";
  verifiedOnChain: boolean;
  walletAddress: string;
  shortAddress: string;
  addressLabel: string;
  note?: string;
  explorerUrl: string;
  solBalance: number;
  lamports: number;
  tokenBalances: Array<{
    mint: string;
    symbol: string;
    name: string;
    amount: number;
    decimals: number;
    usdValue: number;
    explorerUrl: string;
  }>;
  tokenAccountsCount: number;
  recentTransactionCount: number;
  latestActivityAt?: string | null;
  nftCount?: number | null;
  protocolExposure: ExplorerProtocolExposure[];
  interactedWallets: ExplorerCounterparty[];
  relatedEntityDiscovery: {
    topCounterparties: ExplorerCounterparty[];
    mostActivePrograms: Array<{
      module: string;
      label: string;
      count: number;
    }>;
    frequentlyMovedToken: string;
    largestRecentTransaction?: {
      signature: string;
      amount: number;
      tokenSymbol: string;
      type: string;
      createdAt?: string | null;
      explorerUrl: string;
    } | null;
    topInteractionWallet?: ExplorerCounterparty | null;
  };
  tags: string[];
  recentTransactions: ExplorerRecentTransaction[];
  source: string;
}

export interface ExplorerProgramTouch {
  programId: string;
  label: string;
  protocolModule: string;
  badge: string;
  matchesKnownProgram: boolean;
}

export interface ExplorerInstruction {
  index: number;
  programId: string;
  programLabel: string;
  protocolModule: string;
  type: string;
  parsed: boolean;
  summary: string;
  accounts: string[];
}

export interface ExplorerTransferSummary {
  kind: string;
  source: string;
  destination: string;
  amount: number;
  mint?: string | null;
  authority?: string;
  programId: string;
  programLabel: string;
  symbol: string;
}

export interface ExplorerAddressSummary {
  address: string;
  shortAddress: string;
  label: string;
  explorerUrl: string;
  signer?: boolean;
  writable?: boolean;
}

export interface ExplorerTransactionResult {
  queryType: "transaction";
  verifiedOnChain: boolean;
  signature: string;
  shortSignature: string;
  explorerUrl: string;
  slot: number;
  blockTime?: string | null;
  status: string;
  confirmationState: string;
  feeLamports: number;
  feeSol: number;
  signerAddresses: ExplorerAddressSummary[];
  involvedAccounts: ExplorerAddressSummary[];
  instructionCount: number;
  instructions: ExplorerInstruction[];
  programIds: ExplorerProgramTouch[];
  transferSummary: ExplorerTransferSummary[];
  protocolClassification: string;
  rawMeta: {
    computeUnitsConsumed?: number | null;
    preBalances: number[];
    postBalances: number[];
  };
  mirroredClassification?: {
    type: string;
    module: string;
    tokenSymbol?: string;
    amount?: number;
  } | null;
  source: string;
}

export interface ExplorerTokenLargestAccount {
  address: string;
  shortAddress: string;
  amount: number;
  explorerUrl: string;
}

export interface ExplorerTokenResult {
  queryType: "token";
  verifiedOnChain: boolean;
  mintAddress: string;
  shortMintAddress: string;
  explorerUrl: string;
  symbol?: string | null;
  name?: string | null;
  decimals: number;
  totalSupply: number;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  tokenAccountsCount: number;
  largestAccounts: ExplorerTokenLargestAccount[];
  knownByApp: boolean;
  source: string;
}

export interface ExplorerBlockSignature {
  signature: string;
  shortSignature: string;
  explorerUrl: string;
  feeLamports: number;
  status: string;
}

export interface ExplorerBlockResult {
  queryType: "block";
  verifiedOnChain: boolean;
  slot: number;
  blockTime?: string | null;
  blockHeight?: number | null;
  transactionCount: number;
  totalFeesLamports: number;
  totalFeesSol: number;
  explorerUrl: string;
  keyProgramsUsed: Array<{
    programId: string;
    label: string;
    protocolModule: string;
    count: number;
  }>;
  signatures: ExplorerBlockSignature[];
  source: string;
}

export interface ExplorerGraphNode {
  id: string;
  type: string;
  role: string;
  address: string;
  label: string;
  shortLabel: string;
  value: number;
  interactionCount: number;
  explorerUrl: string;
  tags: string[];
}

export interface ExplorerGraphEdge {
  id: string;
  source: string;
  target: string;
  txCount: number;
  totalVolume: number;
  relation: string;
}

export interface ExplorerWalletGraph {
  centerAddress: string;
  nodes: ExplorerGraphNode[];
  edges: ExplorerGraphEdge[];
  legends: Array<{
    label: string;
    tone: string;
  }>;
  source: string;
}

export interface ExplorerFlowNode {
  id: string;
  type: string;
  label: string;
  subtitle: string;
  explorerUrl: string;
}

export interface ExplorerFlowStep {
  id: string;
  from: string;
  to: string;
  label: string;
  value?: string | null;
  status: string;
}

export interface ExplorerTransactionFlow {
  signature: string;
  shortSignature: string;
  status: string;
  confirmationState: string;
  protocolClassification: string;
  feeSol: number;
  feeLamports: number;
  blockTime?: string | null;
  explorerUrl: string;
  nodes: ExplorerFlowNode[];
  steps: ExplorerFlowStep[];
  transferSummary: ExplorerTransferSummary[];
  source: string;
}

export type StrategyBucketKey =
  | "staking"
  | "liquidity"
  | "lending"
  | "hold"
  | "governance"
  | "stableReserve";

export type StrategyTimeframe = "30D" | "90D" | "180D" | "1Y";
export type StrategyScenario = "optimistic" | "base" | "conservative";

export interface StrategyAllocations {
  staking: number;
  liquidity: number;
  lending: number;
  hold: number;
  governance: number;
  stableReserve: number;
}

export interface StrategyAssumptions {
  stakingToken?: string;
  liquidityPair?: string;
  lendingAsset?: string;
  governanceToken?: string;
  stableAsset?: string;
}

export interface StrategyPlanRecord {
  _id: string;
  name: string;
  allocations: StrategyAllocations;
  portfolioCapital: number;
  timeframe: StrategyTimeframe;
  scenario: StrategyScenario;
  assumptions?: StrategyAssumptions;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  allocationTotal?: number;
}

export interface StrategyBucketMetric {
  bucket: StrategyBucketKey;
  label: string;
  allocationPercent: number;
  capitalAllocated: number;
  annualYieldRate: number;
  annualRewardUsd: number;
  periodRewardUsd: number;
  rewardToken: string;
  rewardEstimateTokens: number;
  riskContribution: number;
  volatilityContribution: number;
  description: string;
}

export interface StrategySimulationResponse {
  userId?: string;
  name: string;
  timeframe: StrategyTimeframe;
  scenario: StrategyScenario;
  portfolioCapital: number;
  allocations: StrategyAllocations;
  assumptions: {
    stakingApy: number;
    liquidityApr: number;
    lendingSupplyApr: number;
    governanceYield: number;
    stableReserveYield: number;
    holdAppreciation: number;
  };
  expectedYield: {
    dailyUsd: number;
    monthlyUsd: number;
    annualUsd: number;
    dailyPercent: number;
    monthlyPercent: number;
    annualPercent: number;
    projectedTotalValue: number;
  };
  rewardEstimate: {
    period: StrategyTimeframe;
    periodDays: number;
    totalUsd: number;
    totalTokensEquivalent: number;
    byBucket: Array<{
      bucket: StrategyBucketKey;
      label: string;
      rewardUsd: number;
      rewardToken: string;
      rewardTokens: number;
      contributionPercent: number;
    }>;
  };
  risk: {
    score: number;
    label: string;
    explanation: string;
    stableReserveBuffer: number;
  };
  volatility: {
    score: number;
    label: string;
    range: {
      bestCase: number;
      baseCase: number;
      adverseCase: number;
    };
    scenarioOutlook: {
      bestCase: number;
      baseCase: number;
      adverseCase: number;
    };
  };
  exposureBreakdown: Array<{
    key: StrategyBucketKey;
    label: string;
    value: number;
  }>;
  allocationBreakdown: Array<{
    key: StrategyBucketKey;
    label: string;
    value: number;
    capitalAllocated: number;
    annualYieldRate: number;
    annualRewardUsd: number;
  }>;
  growthSeries: Array<{
    label: string;
    value: number;
    reward: number;
    annualizedReturn: number;
  }>;
  bucketMetrics: StrategyBucketMetric[];
  explainability: {
    highestYieldBucket: string;
    highestRiskBucket: string;
    balanceProfile: string;
    notes: string[];
    diversityScore: number;
  };
  stressTests: Array<{
    key: string;
    label: string;
    description: string;
    drawdownPercent: number;
    yieldDelta: number;
    riskDelta: number;
    updatedRiskScore: number;
    updatedRiskLabel: string;
    updatedAnnualYieldPercent: number;
    updatedProjectedValue: number;
  }>;
  source: string;
}

export interface StrategyComparisonResponse {
  strategies: Array<{
    name: string;
    timeframe: StrategyTimeframe;
    scenario: StrategyScenario;
    annualYieldPercent: number;
    annualYieldUsd: number;
    projectedTotalValue: number;
    riskScore: number;
    riskLabel: string;
    volatilityScore: number;
    volatilityLabel: string;
    balanceProfile: string;
    allocations: StrategyAllocations;
  }>;
  highlights: {
    bestYield: string;
    lowestRisk: string;
    balancedProfile: string;
  };
  source: string;
}

export interface AdminJobRunRecord {
  _id?: string;
  jobName: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  details?: Record<string, unknown>;
  createdAt?: string;
}

export interface WalletTransactionListResponse {
  items: TransactionRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WalletInsightsResponse {
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  favoriteToken: string;
  gasSpent: number;
  walletAge: number;
  averageTxSize: number;
  activityScore: number;
  transactionFrequency?: Array<{ label: string; value: number }>;
  monthlyVolume?: Array<{ label: string; value: number }>;
  profitLossSeries?: Array<{ label: string; value: number }>;
  assetDistribution?: Array<{ label: string; value: number }>;
}

export interface WalletAccount {
  _id: string;
  userId: string;
  publicKey: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityCheckResponse {
  walletAddress: string;
  receiverAddress: string;
  riskLevel: "Safe" | "Suspicious" | "High Risk" | "Blocked";
  riskScore: number;
  confidence: number;
  warnings: string[];
  blocked: boolean;
}

export interface GasOptimizationResponse {
  currentFee: number;
  recommendedFee: number;
  congestionLevel: "Low" | "Moderate" | "High" | string;
  estimatedSavings: number;
  estimatedConfirmationTime: string;
  waitTimeMinutes: number;
  recommendation: string;
  networkHealth: string;
}

export interface TransactionSimulationResponse {
  kind: "send" | "swap";
  expectedResult: Record<string, string | number>;
  networkFee: number;
  successProbability: number;
  warnings: string[];
  priceImpact: number;
  confidenceScore: number;
  riskLevel?: string;
  addressRisk?: SecurityCheckResponse;
  gasOptimization?: GasOptimizationResponse;
  balanceChange?: {
    before: number;
    after: number;
  };
}

export interface WalletRiskScoreResponse {
  walletAddress: string;
  score: number;
  riskLevel: "Very Safe" | "Safe" | "Medium Risk" | "High Risk" | "Critical Risk";
  recommendations: string[];
  metrics: {
    unknownTokenInteractions: number;
    largeTransactionSpikes: number;
    suspiciousInteractions: number;
    failedTransactions: number;
    walletAgeDays: number;
    transactionConsistency: number;
    addressBookCoverage: number;
  };
  updatedAt?: string;
}

export interface AiPortfolioAdviceResponse {
  riskLevel: "Low" | "Medium" | "High" | string;
  recommendations: string[];
  portfolioInsights: string[];
  confidence: number;
  diversificationScore: number;
  dominantAsset: string;
  dominantAllocation: number;
  stablecoinShare: number;
}

export interface AssistantActionLink {
  label: string;
  href: string;
  intent: string;
}

export interface AssistantInsightRecord {
  id: string;
  category: string;
  title: string;
  message: string;
  severity: "info" | "caution" | "warning" | "high-risk" | string;
  confidence: number;
  relevance: "High" | "Medium" | "Normal" | string;
  action?: AssistantActionLink;
  why?: string;
  trigger?: string;
  impact?: string;
}

export interface AssistantOpportunityRecord {
  id: string;
  type: string;
  title: string;
  message: string;
  impact?: string;
  confidence: number;
  action?: AssistantActionLink;
  badge?: string;
}

export interface AssistantRebalancingRecord {
  id: string;
  bucket: string;
  title: string;
  message: string;
  expectedRiskImpact: number;
  expectedYieldImpact: number;
  reason: string;
  targetAllocation: number;
  action?: AssistantActionLink;
}

export interface AssistantExplanationRecord {
  id: string;
  question: string;
  answer: string;
  sourceMetric: string;
  sourceValue: string;
}

export interface AssistantSummaryResponse {
  walletAddress: string;
  generatedAt: string;
  mode: string;
  summaryText: string;
  disclaimer: string;
  portfolioStatus: {
    label: string;
    score: number;
    confidence: number;
    summary: string;
  };
  topOpportunity: AssistantOpportunityRecord | null;
  topRisk: AssistantInsightRecord | null;
  topYieldSource: {
    label: string;
    annualRate: number;
    contributionPercent: number;
  } | null;
  diversificationStatus: {
    label: string;
    score: number;
    summary: string;
  };
  yieldEfficiencyScore: number;
  insights: AssistantInsightRecord[];
  yieldSuggestions: AssistantInsightRecord[];
  riskWarnings: AssistantInsightRecord[];
  rebalancing: AssistantRebalancingRecord[];
  opportunities: AssistantOpportunityRecord[];
  explanation: AssistantExplanationRecord[];
  actionLinks: AssistantActionLink[];
  source: string;
  metadata?: {
    riskRecommendations?: Array<{
      title: string;
      detail: string;
      severity: string;
    }>;
    currentAllocations?: Record<string, number>;
    suggestedAllocations?: Record<string, number>;
    currentSimulation?: {
      riskScore: number;
      annualYieldPercent: number;
    };
    suggestedSimulation?: {
      riskScore: number;
      annualYieldPercent: number;
    };
  };
}

export interface AssistantHistoryResponse {
  walletAddress: string;
  items: Array<{
    id: string;
    createdAt: string;
    portfolioStatus: string;
    score: number;
    topOpportunity?: string | null;
    topRisk?: string | null;
    diversificationScore: number;
    confidence: number;
    summaryText: string;
  }>;
  source: string;
}

export interface SecurityAlert {
  id: string;
  severity: "success" | "info" | "caution" | "warning" | "danger" | string;
  title: string;
  description: string;
  source: string;
  createdAt: string;
}

export type MarketCurrency = "usd" | "inr" | "krw";
export type MarketRange = "1H" | "24H" | "7D" | "1M" | "3M" | "1Y" | "MAX";

export interface MarketSparklinePoint {
  label: string;
  value: number;
}

export interface MarketOverviewStat {
  label: string;
  value: number | string;
  change: number;
  sparkline: MarketSparklinePoint[];
}

export interface MarketCoin {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  sparkline: MarketSparklinePoint[];
  ath: number;
  atl: number;
  lastUpdated: string;
  currency: string;
}

export interface MarketOverviewResponse {
  marketCap: number;
  btcDominance: number;
  totalVolume24h: number;
  sentiment: string;
  topGainer?: MarketCoin;
  topLoser?: MarketCoin;
  stats: MarketOverviewStat[];
  lastUpdated: string;
}

export interface MarketCoinsResponse {
  items: MarketCoin[];
  page: number;
  perPage: number;
  total: number;
  lastUpdated: string;
}

export interface MarketChartPoint {
  timestamp: number;
  price: number;
  marketCap: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
  range: string;
}

export interface MarketChartResponse {
  id: string;
  range: string;
  currency: string;
  points: MarketChartPoint[];
  lastUpdated: string;
}

export interface MarketCoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: string;
  description: string;
  price: number;
  marketCap: number;
  totalVolume: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  high24h: number;
  low24h: number;
  ath: number;
  atl: number;
  athDate?: string;
  atlDate?: string;
  priceChange24h: number;
  priceChange7d: number;
  sentiment: string;
  sparkline: MarketSparklinePoint[];
  links?: Record<string, unknown>;
  explorers: string[];
  lastUpdated: string;
}

export interface MarketMoversResponse {
  items: MarketCoin[];
  lastUpdated: string;
}

export interface MarketProfitLossResponse {
  investedValue: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface MarketWatchlist {
  userId?: string;
  coinIds: string[];
  currency: string;
}

export interface MarketHolding {
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface MarketPriceAlert {
  id: string;
  coinId: string;
  symbol: string;
  direction: "above" | "below";
  targetPrice: number;
  triggered?: boolean;
  createdAt: string;
}

export type TradingSymbol =
  | "BTCUSDT"
  | "ETHUSDT"
  | "SOLUSDT"
  | "BNBUSDT"
  | "XRPUSDT"
  | "ADAUSDT"
  | "AVAXUSDT"
  | "DOGEUSDT";

export type TradingInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";
export type TradingChartMode = "candles" | "line" | "area";

export interface TradingSparklinePoint {
  label: string;
  value: number;
}

export interface TradingTickerItem {
  symbol: TradingSymbol;
  baseAsset: string;
  quoteAsset: string;
  name: string;
  image?: string | null;
  lastPrice: number;
  priceChangePercent: number;
  priceChange: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  weightedAvgPrice: number;
  tradeCount: number;
  marketCap: number;
  circulatingSupply: number;
  ath: number;
  atl: number;
  sparkline: TradingSparklinePoint[];
}

export interface TradingTickerResponse {
  items: TradingTickerItem[];
  topGainers: TradingTickerItem[];
  topLosers: TradingTickerItem[];
  mostActive: TradingTickerItem[];
  highestVolume: TradingTickerItem[];
  lastUpdated: string;
}

export interface TradingCandle {
  time: number;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  trades: number;
  isBullish: boolean;
}

export interface TradingLinePoint {
  time: number;
  value: number;
}

export interface TradingBollingerPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface TradingMacdSet {
  macdLine: Array<TradingLinePoint | null>;
  signalLine: Array<TradingLinePoint | null>;
  histogram: Array<TradingLinePoint | null>;
}

export interface TradingIndicators {
  sma: Array<TradingLinePoint | null>;
  ema: Array<TradingLinePoint | null>;
  rsi: Array<TradingLinePoint | null>;
  macd: TradingMacdSet;
  bollinger: Array<TradingBollingerPoint | null>;
  volumeMa: Array<TradingLinePoint | null>;
}

export interface TradingCandlesResponse {
  symbol: TradingSymbol;
  interval: TradingInterval;
  candles: TradingCandle[];
  indicators: TradingIndicators;
  lastUpdated: string;
}

export interface TradingMarketStats extends TradingTickerItem {
  trend: "Bullish" | "Bearish" | "Neutral";
  volatilityScore: number;
  liveStatus: string;
  networkStatus: string;
}

export interface TradingAlert {
  _id: string;
  symbol: TradingSymbol;
  conditionType: "above" | "below" | "smaCross" | "percentDrop";
  targetValue: number;
  indicator?: string;
  status: "active" | "triggered" | "disabled";
  createdAt: string;
}

export interface TradingWorkspace {
  _id?: string;
  userId?: string;
  watchlistSymbols: TradingSymbol[];
  alerts: TradingAlert[];
}

export interface TradingTradeMarker {
  id: string;
  time: number;
  price: number;
  side: "buy" | "sell";
  text: string;
  symbol?: TradingSymbol;
  quantity?: number;
}

export interface TradingSimulationResponse {
  symbol: TradingSymbol;
  side: "buy" | "sell";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  feeEstimate: number;
  totalCost: number;
  unrealizedPnl: number;
  roiPercent: number;
  estimatedProfit: number;
  estimatedLoss: number;
  riskRewardRatio: number;
  marker: {
    time: number;
    price: number;
    side: "buy" | "sell";
    text: string;
  };
}

export interface TradingCompareResponse {
  base: {
    symbol: TradingSymbol;
    series: TradingLinePoint[];
    volatility: number;
    marketCap: number;
    priceChangePercent: number;
  };
  target: {
    symbol: TradingSymbol;
    series: TradingLinePoint[];
    volatility: number;
    marketCap: number;
    priceChangePercent: number;
  };
  interval: TradingInterval;
  lastUpdated: string;
}

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  walletAddress?: string;
  avatar?: string;
};

export type AppLockPeriod = {
  id: string;
  label: string;
  durationDays: number;
  apy: number;
  minAmount: number;
  penaltyFee: number;
  enabled: boolean;
};

export type AppTransaction = {
  id: string;
  type: string;
  token: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type AppPool = {
  id: string;
  pair: string;
  tokenA: string;
  tokenB: string;
  totalLiquidity: number;
  apr: number;
  volume24h: number;
  feePercent: number;
  priceImpact?: number;
  yourShare?: number;
};

export type AppLendingMarket = {
  id: string;
  token: string;
  supplyApr: number;
  borrowApr: number;
  utilization: number;
  collateralFactor: number;
  totalSupplied: number;
  totalBorrowed: number;
};

export type AppProposal = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: "active" | "passed" | "rejected" | "pending" | "archived";
  startDate: string;
  endDate: string;
  quorum: number;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
};

export interface StakeOverviewStats {
  cards: StatCardItem[];
}

export interface PortfolioOverview {
  token: string;
  stakedAmount: number;
  fiatValue: number;
  rewardGrowth: number;
  chartData: Array<{ label: string; value: number }>;
}

export interface RewardCalculationInput {
  amount: number;
  durationDays: number;
  apy: number;
}

export interface RewardCalculationResult {
  estimatedReward: number;
  projectedValue: number;
}

export interface TokenOption {
  label: string;
  value: string;
  color?: string;
}

export interface CreateStakeInput {
  tokenSymbol: string;
  amount: number;
  durationDays: number;
}

export interface AdminUserView {
  _id: string;
  name: string;
  email: string;
  walletAddress: string;
  totalStaked: number;
  rewardEarned: number;
  status: string;
}

export interface RewardRateSettings {
  rewardRate: number;
  apyType: string;
  maxStakeLimit: number;
  poolCapacity: number;
  earlyWithdrawalFee: number;
  poolActive: boolean;
  autoCompounding: boolean;
}

export type AdminSettingsInput = Partial<AdminSettings>;

export type LockPeriodInput = Omit<LockPeriod, "_id">;

export type SystemState = Pick<
  AdminSettings,
  "poolActive" | "maintenanceMode" | "claimsFrozen" | "withdrawalsFrozen"
>;

export type EmergencyActionType =
  | "pause_staking"
  | "resume_staking"
  | "freeze_claims"
  | "freeze_withdrawals"
  | "maintenance_mode"
  | "disable_pool";

export interface SystemHealth {
  totalLockedLiquidity: number;
  activeUsers: number;
  pendingClaims: number;
  totalRewardsDistributed: number;
  utilization: number;
  warnings: string[];
}

export interface PoolsStats {
  cards: StatCardItem[];
}

export interface PoolSimulationInput {
  poolId: string;
  amountA: number;
  amountB: number;
}

export interface PoolSimulationResult {
  selectedPair: string;
  shareOfPool: number;
  expectedLpTokens: number;
  estimatedApr: number;
  priceImpact?: number;
  slippagePreview: number;
  tokenBAutoCalculated: number;
}

export interface AddLiquidityInput {
  poolId: string;
  amountA: number;
  amountB: number;
}

export interface RemoveLiquidityInput {
  positionId: string;
  percent: number;
}

export interface FeeHistoryPoint {
  label: string;
  value: number;
}

export interface LendingStats {
  cards: StatCardItem[];
}

export interface LendingActionInput {
  token: string;
  amount: number;
}

export interface LendingSimulationResult {
  projectedHealthFactor: number;
  projectedCollateralValue: number;
  projectedBorrowValue: number;
  liquidationRisk: string;
}

export interface BorrowSimulationInput {
  asset: string;
  borrowAmount: number;
  priceDropPercent: number;
}

export type BorrowSimulationResult = LendingSimulationResult;

export interface GovernanceStats {
  activeProposals: number;
  totalVotesCast: number;
  yourVotingPower: number;
  treasuryParticipation: number;
}

export interface ProposalVoteStats {
  yes: number;
  no: number;
  abstain: number;
  quorum: number;
  totalVotes: number;
}

export interface VestingData {
  lockedGovernanceTokens: number;
  vestingDuration: number;
  currentVotingPower: number;
  delegatedPower: number;
  claimableGovernanceRewards: number;
}

export interface CreateProposalInput {
  title: string;
  category: string;
  description: string;
  startDate: string;
  endDate: string;
  quorum: number;
}

export type MyVoteHistory = VoteRecord;

export type OnChainSource = "on-chain" | "fallback";

export interface OnChainProgramStatus {
  module: "staking" | "liquidity" | "lending" | "governance" | "spl";
  label: string;
  programId: string;
  explorerUrl: string;
  configAddress?: string;
  configExplorerUrl?: string;
  deployed: boolean;
  source: OnChainSource;
  notes?: string[];
}

export interface OnChainActionResult {
  label: string;
  status: "prepared" | "submitted" | "confirmed" | "fallback";
  source: "on-chain" | "rest";
  message: string;
  signature?: string;
  explorerUrl?: string;
}

export interface OnChainLockPeriodSummary {
  address?: string;
  label?: string;
  durationDays: number;
  apyBps: number;
  enabled: boolean;
  minAmount?: number;
  penaltyBps?: number;
  earlyUnstakeEnabled?: boolean;
}

export interface OnChainStakingConfig {
  program: OnChainProgramStatus;
  admin?: string;
  stakingMint?: string;
  rewardMint?: string;
  treasuryVault?: string;
  rewardVault?: string;
  stakingEnabled: boolean;
  rewardRateBps: number;
  lockPeriods: OnChainLockPeriodSummary[];
}

export interface OnChainStakePosition {
  address: string;
  explorerUrl: string;
  amount: number;
  lockLabel?: string;
  durationDays: number;
  startedAt: number;
  endsAt: number;
  claimedRewards: number;
  pendingRewards?: number;
  unstaked?: boolean;
  source: OnChainSource;
}

export interface OnChainLiquidityPoolSummary {
  address: string;
  explorerUrl: string;
  admin?: string;
  tokenA: string;
  tokenB: string;
  reserveA?: number;
  reserveB?: number;
  lpMint?: string;
  feeRateBps: number;
  totalLiquidity: number;
  paused: boolean;
  source: OnChainSource;
}

export interface OnChainLiquidityPositionSummary {
  address: string;
  poolAddress: string;
  explorerUrl: string;
  lpAmount: number;
  depositedA: number;
  depositedB: number;
  source: OnChainSource;
}

export interface OnChainLendingMarketSummary {
  address: string;
  explorerUrl: string;
  admin?: string;
  collateralMint: string;
  borrowMint: string;
  collateralVault?: string;
  liquidityVault?: string;
  collateralFactorBps: number;
  liquidationThresholdBps: number;
  borrowInterestBps?: number;
  protocolFeeBps?: number;
  paused: boolean;
  source: OnChainSource;
}

export interface OnChainLendingPositionSummary {
  address: string;
  marketAddress: string;
  explorerUrl: string;
  collateralAmount: number;
  borrowedAmount: number;
  interestDebt: number;
  healthFactor: number;
  source: OnChainSource;
}

export interface OnChainGovernanceSummary {
  address: string;
  explorerUrl: string;
  proposalId?: number;
  proposer?: string;
  metadataUri?: string;
  title: string;
  status: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  startTime: number;
  endTime: number;
  source: OnChainSource;
}

export interface OnChainGovernanceConfig {
  program: OnChainProgramStatus;
  admin?: string;
  governanceMint?: string;
  quorumBps: number;
  votingDurationSeconds: number;
  proposalThreshold?: number;
}

export type SocialVisibility = "private" | "public" | "summary";

export interface SocialBadgeRecord {
  walletAddress: string;
  badgeKey: string;
  badgeLabel: string;
  reason: string;
  assignedAt?: string;
}

export interface SocialRiskLike {
  score: number;
  label: string;
  explanation?: string;
}

export interface SocialReputationRecord {
  score: number;
  label: string;
  summary: string;
}

export interface SocialProfileSummary {
  portfolioValue: number | null;
  portfolioChange24h: number | null;
  tokenAllocation: Array<{
    symbol: string;
    amount?: number;
    value: number;
    allocationPercent: number;
  }>;
  topAssets: Array<{
    symbol: string;
    value: number;
    allocationPercent: number;
  }>;
  stakingExposure: number | null;
  liquidityExposure: number | null;
  lendingExposure: number | null;
  governanceParticipation: number | null;
  nftCount: number | null;
  transactionCount: number;
  latestActivityAt: string | null;
  firstSeenAt: string | null;
  diversity: SocialRiskLike | null;
  risk: SocialRiskLike | null;
  chart: Array<{
    label: string;
    value: number;
    pnl: number;
  }>;
}

export interface SocialFeedItem {
  id: string;
  walletAddress: string;
  displayName: string;
  type: string;
  protocolModule: string;
  title: string;
  description: string;
  amount?: number;
  tokenSymbol?: string;
  signature?: string;
  explorerUrl?: string;
  createdAt: string;
}

export interface SharedPortfolioSnapshotRecord {
  _id: string;
  walletAddress: string;
  title: string;
  timeframe: string;
  visibility: SocialVisibility;
  summaryData: {
    portfolioValue?: number | null;
    pnl?: number | null;
    allocation?: Array<{
      symbol: string;
      value?: number;
      allocationPercent?: number;
    }>;
    topAssets?: Array<{
      symbol: string;
      allocationPercent?: number;
    }>;
    riskScore?: number | null;
    timeframe?: string;
    displayName?: string;
  };
  createdAt: string;
}

export interface SocialProfileRecord {
  walletAddress: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  tags?: string[];
  visibility: SocialVisibility;
  isAccessible: boolean;
  isOwner?: boolean;
  isFollowing?: boolean;
  privateNotice?: string;
  profileSettings?: {
    isDiscoverable: boolean;
    showInLeaderboards: boolean;
    showInTrending: boolean;
    visibilitySettings: Partial<{
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
  };
  socialStats?: {
    followers: number;
    following: number;
  };
  badges?: SocialBadgeRecord[];
  reputation?: SocialReputationRecord | null;
  summary?: SocialProfileSummary;
  activity?: SocialFeedItem[];
  sharedSnapshots?: SharedPortfolioSnapshotRecord[];
}

export interface SocialTrendingWallet {
  rank: number;
  walletAddress: string;
  displayName: string;
  avatar?: string;
  tags: string[];
  badges: SocialBadgeRecord[];
  trendReason: string;
  followerCount: number;
  valueChange: number;
  currentValue: number;
  activitySummary: string;
  riskLabel: string;
  reputation: SocialReputationRecord;
  trendScore: number;
  latestActivityAt: string | null;
}

export interface SocialLeaderboardEntry {
  rank: number;
  walletAddress: string;
  displayName: string;
  avatar?: string;
  badge: string;
  metricValue: number;
  metricLabel: string;
  movement: "up" | "down" | "unchanged" | "new";
  followerCount: number;
  change24h: number;
}

export interface SocialLeaderboardCategory {
  key: string;
  label: string;
  description: string;
  period: "today" | "7d" | "30d" | "all";
  items: SocialLeaderboardEntry[];
}

export interface SocialFollowingWallet {
  walletAddress: string;
  displayName: string;
  avatar?: string;
  tags: string[];
  followers: number;
  portfolioValue: number | null;
  portfolioChange24h: number | null;
  reputation: SocialReputationRecord | null;
  latestActivityAt: string | null;
}

export interface SocialFollowingResponse {
  wallets: SocialFollowingWallet[];
  feed: SocialFeedItem[];
}

export interface SocialSearchResult {
  walletAddress: string;
  displayName: string;
  avatar?: string;
  tags: string[];
  badges: SocialBadgeRecord[];
  currentValue: number;
  change24h: number;
  followerCount: number;
  risk: SocialRiskLike;
  diversity: SocialRiskLike;
  reputation: SocialReputationRecord;
  latestActivityAt: string | null;
}

export type TreasuryRange = "7D" | "30D" | "90D" | "1Y" | "ALL";

export interface TreasuryWalletRecord {
  label: string;
  address: string;
  shortAddress: string;
  category: string;
  value: number;
  holdingsCount: number;
  explorerUrl: string;
  notes?: string;
}

export interface TreasuryOverviewResponse {
  configured: boolean;
  treasuryName: string;
  sourceOfTruth: string;
  totalTreasuryValue?: number;
  treasuryTokenCount?: number;
  liquidAssets?: number;
  committedAssets?: number;
  change24h?: number;
  trend30d?: number;
  treasuryHealthScore?: number;
  treasuryHealthLabel?: string;
  stablecoinRatio?: number;
  governanceTokenRatio?: number;
  idleCapitalRatio?: number;
  deployedCapitalRatio?: number;
  largestAsset?: {
    symbol: string;
    usdValue: number;
    allocationPercent: number;
    category: string;
  } | null;
  activeSpendingProposals?: number;
  wallets?: TreasuryWalletRecord[];
  latestRecordedAt?: string | null;
  insights?: string[];
}

export interface TreasuryAssetRecord {
  symbol: string;
  name: string;
  icon?: string;
  tokenMint?: string;
  balance: number;
  usdValue: number;
  allocationPercent: number;
  change24h: number;
  category: string;
  walletCount: number;
  tag: string;
  explorerUrl?: string;
}

export interface TreasuryAssetsResponse {
  configured: boolean;
  assets: TreasuryAssetRecord[];
  wallets: Array<{
    label: string;
    address: string;
    category: string;
    notes?: string;
    explorerUrl: string;
    totalValue: number;
    holdingsCount: number;
  }>;
  latestRecordedAt?: string | null;
}

export interface TreasuryAllocationItem {
  symbol?: string;
  category?: string;
  value: number;
  allocationPercent: number;
}

export interface TreasuryAllocationResponse {
  configured: boolean;
  tokenAllocation: TreasuryAllocationItem[];
  categoryAllocation: TreasuryAllocationItem[];
  concentrationWarning?: string;
  largestAsset?: {
    symbol: string;
    usdValue: number;
    allocationPercent: number;
    category: string;
  } | null;
  insights: string[];
}

export interface TreasuryGrowthResponse {
  range: TreasuryRange;
  series: Array<{
    label: string;
    value: number;
    liquidAssets: number;
    committedAssets: number;
  }>;
  eventMarkers: Array<{
    id: string;
    label: string;
    date: string;
    impact: string;
  }>;
  source: string;
}

export interface TreasuryRecommendation {
  title: string;
  detail: string;
  priority: "low" | "medium" | "high";
}

export interface TreasuryHealthResponse {
  configured: boolean;
  score?: number;
  label?: string;
  stableReserveStrength?: string;
  concentrationRisk?: string;
  liquidReserveSufficiency?: string;
  rewardRunwayPressure?: string;
  governanceDependency?: string;
  spendingVelocity?: number;
  explanations?: string[];
  recommendations?: TreasuryRecommendation[];
}

export interface TreasuryRunwayResponse {
  configured: boolean;
  monthlyOutflowEstimate?: number;
  rewardFundingMonthly?: number;
  grantsCommitmentMonthly?: number;
  stableReserveRunwayMonths?: number;
  totalReserveRunwayMonths?: number;
  warning?: string;
}

export interface TreasuryProposalRecord {
  id: string;
  title: string;
  category: string;
  requestedAmount: number;
  requestedToken: string;
  targetAllocation: string;
  status: string;
  proposer: string;
  summary: string;
  treasuryImpact: string;
  executionConditions: string;
  quorumProgress: number;
  deadline: string;
  explorerUrl?: string;
}

export interface TreasuryProposalsResponse {
  proposals: TreasuryProposalRecord[];
}

export interface TreasuryFlowPoint {
  label: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface TreasuryEventRecord {
  id: string;
  type: string;
  title: string;
  description: string;
  token?: string;
  amount?: number;
  impact: "low" | "medium" | "high" | string;
  createdAt: string;
  explorerUrl?: string;
  relatedProposal?: string;
  txSignature?: string;
}

export interface TreasuryFlowsResponse {
  configured: boolean;
  monthly: TreasuryFlowPoint[];
  recentEvents: TreasuryEventRecord[];
  inflowTotal: number;
  outflowTotal: number;
}

export interface TreasuryEventsResponse {
  configured: boolean;
  events: TreasuryEventRecord[];
}

export interface TaxScopeWallet {
  address: string;
  label: string;
}

export interface TaxScopeRecord {
  type: "wallet" | "group";
  id: string;
  name: string;
  wallets: TaxScopeWallet[];
}

export interface TaxFiltersRecord {
  year: number;
  startDate?: string;
  endDate?: string;
  includeProtocols: string[];
  excludeProtocols: string[];
  includeTokens: string[];
  excludeTokens: string[];
}

export interface TaxSummaryResponse {
  scope: TaxScopeRecord;
  filters: TaxFiltersRecord;
  year: number;
  generatedAt: string;
  currentPortfolioValue: number;
  portfolioChange: number;
  totalCapitalGains: number;
  totalCapitalLosses: number;
  netCapitalGains: number;
  totalStakingIncome: number;
  totalLendingIncome: number;
  combinedTaxableActivityTotal: number;
  totalTaxableEvents: number;
  largestGainThisYear?: {
    token: string;
    value: number;
  } | null;
  largestIncomeSource?: {
    token: string;
    value: number;
  } | null;
  topWinningAsset?: {
    token: string;
    value: number;
  } | null;
  topLosingAsset?: {
    token: string;
    value: number;
  } | null;
  warnings: string[];
}

export interface TaxCapitalGainRow {
  token: string;
  acquiredAmount: number;
  disposedAmount: number;
  averageAcquisitionCost: number;
  disposalValue: number;
  capitalGainLoss: number;
  holdingPeriodDays: number;
  holdingPeriodLabel: string;
}

export interface TaxCapitalGainsResponse {
  scope: TaxScopeRecord;
  year: number;
  summary: TaxSummaryResponse;
  rows: TaxCapitalGainRow[];
  totalGains: number;
  totalLosses: number;
  netCapitalGains: number;
  topWinningAsset?: {
    token: string;
    value: number;
  } | null;
  topLosingAsset?: {
    token: string;
    value: number;
  } | null;
}

export interface TaxIncomeEvent {
  id: string;
  walletAddress: string;
  type: "capital-gain" | "staking-income" | "lending-income";
  sourceModule: string;
  label: string;
  token: string;
  amount: number;
  usdValue: number;
  gainLoss?: number;
  txSignature?: string;
  eventDate: string;
}

export interface TaxIncomeByToken {
  token: string;
  totalAmount: number;
  totalUsdValue: number;
  sources: Record<string, number>;
}

export interface TaxStakingIncomeResponse {
  scope: TaxScopeRecord;
  year: number;
  summary: TaxSummaryResponse;
  events: TaxIncomeEvent[];
  totalStakingRewards: number;
  usdEquivalentIncome: number;
  rewardEvents: number;
  bestRewardMonth?: string | null;
  incomeByToken: TaxIncomeByToken[];
}

export interface TaxLendingIncomeResponse {
  scope: TaxScopeRecord;
  year: number;
  summary: TaxSummaryResponse;
  events: TaxIncomeEvent[];
  totalLendingIncome: number;
  monthlyLendingIncome: Array<{
    label: string;
    value: number;
  }>;
  protocolBreakdown: Array<{
    token: string;
    protocol: string;
    value: number;
  }>;
  incomeByToken: TaxIncomeByToken[];
}

export interface TaxMonthlySummaryRow {
  label: string;
  capitalGains: number;
  stakingIncome: number;
  lendingIncome: number;
  totalTaxableValue: number;
  taxableEvents: number;
}

export interface TaxYearlyReportResponse {
  scope: TaxScopeRecord;
  filters: TaxFiltersRecord;
  generatedAt: string;
  summary: TaxSummaryResponse;
  capitalGains: TaxCapitalGainsResponse;
  stakingIncome: TaxStakingIncomeResponse;
  lendingIncome: TaxLendingIncomeResponse;
  yearlySummary: {
    year: number;
    totalCapitalGains: number;
    totalStakingIncome: number;
    totalLendingIncome: number;
    combinedTaxableActivityTotal: number;
    topActivityTypes: string[];
    totalTransactionsAnalyzed: number;
    monthly: TaxMonthlySummaryRow[];
  };
  monthlyTrend: TaxMonthlySummaryRow[];
  incomeByToken: TaxIncomeByToken[];
  eventTimeline: TaxIncomeEvent[];
  disclaimer: string;
}

export interface TaxExportResponse {
  format: "csv" | "json" | "pdf";
  filename: string;
  mimeType: string;
  content: string;
  encoding?: "base64";
  generatedAt: string;
}

export type NetworkMonitorRange = "1H" | "24H" | "7D" | "30D";

export interface NetworkOverviewCard {
  key: string;
  label: string;
  value: number;
  unit: string;
  trend: number;
  lastUpdated: string;
  status: string;
  sparkline: number[];
}

export interface NetworkHealthBreakdownItem {
  key: string;
  label: string;
  score: number;
}

export interface NetworkMetricPoint {
  label: string;
  recordedAt: string;
  tps?: number;
  recentAverageTps?: number;
  peakTps?: number;
  blockTime?: number;
  throughput?: number;
  avgFee?: number;
  validatorCount?: number;
  rpcLatency?: number;
  healthScore?: number;
  value?: number;
}

export interface NetworkEndpointStatus {
  endpointLabel: string;
  endpointUrl: string;
  latency: number;
  version: string;
  blockHeight: number;
  status: "healthy" | "moderate" | "degraded";
  recommended: boolean;
}

export interface NetworkOverviewResponse {
  network: string;
  endpointLabel: string;
  endpointUrl: string;
  environment: string;
  range: NetworkMonitorRange;
  autoRefreshSuggestedMs: number;
  lastUpdated: string;
  current: {
    tps: number;
    recentAverageTps: number;
    peakTps: number;
    blockTime: number;
    avgBlockTime: number;
    throughput: number;
    averageThroughput: number;
    avgFee: number;
    feeLow: number;
    feeHigh: number;
    validatorCount: number;
    activeValidators: number;
    delinquentValidators: number;
    rpcLatency: number;
    slot: number;
    blockHeight: number;
    version: string;
  };
  health: {
    score: number;
    label: string;
    status: string;
    primaryIssue: NetworkHealthBreakdownItem;
    breakdown: NetworkHealthBreakdownItem[];
  };
  thresholdWarnings: string[];
  cards: NetworkOverviewCard[];
  protocolImpact: {
    summary: string;
    items: string[];
  };
  endpointComparison: NetworkEndpointStatus[];
}

export interface NetworkMetricSeriesResponse {
  range: NetworkMonitorRange;
  label: string;
  unit: string;
  current: number;
  average: number;
  peak: number;
  low: number;
  lastUpdated: string | null;
  points: Array<{
    label: string;
    recordedAt: string;
    value: number;
  }>;
  recentAverage?: number;
  healthIndicator?: string;
  deviation?: number;
  stabilityLabel?: string;
  usageIntensity?: string;
  feeBuckets?: {
    low: number;
    average: number;
    high: number;
  };
  activeValidators?: number;
  delinquentValidators?: number;
  bestRecentLatency?: number;
  worstRecentLatency?: number;
  endpointLabel?: string;
}

export interface NetworkHealthResponse {
  range: NetworkMonitorRange;
  score: number;
  label: string;
  status: string;
  primaryIssue: NetworkHealthBreakdownItem;
  breakdown: NetworkHealthBreakdownItem[];
  thresholdWarnings: string[];
  protocolImpact: {
    summary: string;
    items: string[];
  };
  bestRecentLatency: number;
  worstRecentLatency: number;
  lastUpdated: string;
  healthSeries: Array<{
    label: string;
    recordedAt: string;
    value: number;
  }>;
}

export interface NetworkStatusEventRecord {
  _id?: string;
  network: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  metricKey: string;
  metricValue: number;
  createdAt: string;
}

export interface NetworkStatusEventsResponse {
  items: NetworkStatusEventRecord[];
  lastUpdated: string | null;
}
