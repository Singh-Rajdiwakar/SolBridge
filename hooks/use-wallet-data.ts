"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useActiveWallet } from "@/hooks/use-active-wallet";
import {
  fetchGovernanceConfig,
  fetchProposals,
} from "@/services/governanceProgramService";
import {
  fetchLendingMarket,
  fetchUserPosition,
} from "@/services/lendingProgramService";
import {
  fetchPools,
  fetchUserLiquidityPositions,
} from "@/services/liquidityProgramService";
import { addressBookApi, aiApi, gasApi, securityApi, walletApi } from "@/services/api";
import {
  fetchStakingConfig,
  fetchUserStakePositions,
} from "@/services/stakingProgramService";
import { useAuthStore } from "@/store/auth-store";
import type { OnChainProgramStatus } from "@/types";

export function useWalletData() {
  const authUser = useAuthStore((state) => state.user);
  const wallet = useActiveWallet();
  const { address, providerName, connected } = wallet;
  const autoRefreshEnabled = authUser?.preferences?.autoRefreshEnabled ?? true;

  const balanceQuery = useQuery({
    queryKey: ["wallet", "balance", address, providerName],
    queryFn: () => walletApi.balance(address!, providerName || "Retix Wallet"),
    enabled: Boolean(address),
  });

  const portfolioQuery = useQuery({
    queryKey: ["wallet", "portfolio", address, providerName],
    queryFn: () => walletApi.portfolio(address!, providerName || "Retix Wallet"),
    enabled: Boolean(address),
  });

  const transactionsQuery = useQuery({
    queryKey: ["wallet", "transactions", address],
    queryFn: () => walletApi.transactions(address!),
    enabled: Boolean(address),
  });

  const nftQuery = useQuery({
    queryKey: ["wallet", "nfts", address],
    queryFn: () => walletApi.nfts(address!),
    enabled: Boolean(address),
  });

  const insightsQuery = useQuery({
    queryKey: ["wallet", "insights", address],
    queryFn: () => walletApi.insights(address!),
    enabled: Boolean(address),
  });

  const addressBookQuery = useQuery({
    queryKey: ["wallet", "address-book"],
    queryFn: () => addressBookApi.list(),
    enabled: Boolean(authUser),
  });

  const walletScoreQuery = useQuery({
    queryKey: ["wallet", "wallet-score", address],
    queryFn: () => securityApi.walletScore(address!),
    enabled: Boolean(address),
  });

  const gasOptimizationQuery = useQuery({
    queryKey: ["wallet", "gas-optimization", address],
    queryFn: () => gasApi.optimize(address!),
    enabled: Boolean(address),
    staleTime: 1000 * 30,
  });

  const alertsQuery = useQuery({
    queryKey: ["wallet", "security-alerts", address],
    queryFn: () => securityApi.alerts(address!),
    enabled: Boolean(address),
    refetchInterval: autoRefreshEnabled ? 1000 * 45 : false,
  });

  const stakingConfigQuery = useQuery({
    queryKey: ["staking-config"],
    queryFn: fetchStakingConfig,
  });

  const stakingPositionsQuery = useQuery({
    queryKey: ["user-stakes", address],
    queryFn: () => fetchUserStakePositions(address),
    enabled: Boolean(address),
  });

  const liquidityPoolsQuery = useQuery({
    queryKey: ["onchain-pools"],
    queryFn: fetchPools,
  });

  const liquidityPositionsQuery = useQuery({
    queryKey: ["user-liquidity-positions", address],
    queryFn: () => fetchUserLiquidityPositions(address),
    enabled: Boolean(address),
  });

  const lendingMarketQuery = useQuery({
    queryKey: ["lending-market"],
    queryFn: fetchLendingMarket,
  });

  const lendingPositionQuery = useQuery({
    queryKey: ["lending-position", address],
    queryFn: () => fetchUserPosition(address),
    enabled: Boolean(address),
  });

  const governanceConfigQuery = useQuery({
    queryKey: ["governance-config"],
    queryFn: fetchGovernanceConfig,
  });

  const governanceProposalsQuery = useQuery({
    queryKey: ["onchain-proposals"],
    queryFn: fetchProposals,
  });

  const portfolioTokens = useMemo(
    () => portfolioQuery.data?.tokens || balanceQuery.data?.tokens || [],
    [balanceQuery.data?.tokens, portfolioQuery.data?.tokens],
  );

  const balanceHistory = useMemo(
    () => portfolioQuery.data?.balanceHistory || [],
    [portfolioQuery.data?.balanceHistory],
  );

  const transactions = useMemo(() => transactionsQuery.data?.items || [], [transactionsQuery.data?.items]);
  const addressBook = useMemo(() => addressBookQuery.data || [], [addressBookQuery.data]);
  const alerts = useMemo(() => alertsQuery.data || [], [alertsQuery.data]);

  const portfolioAdviceQuery = useQuery({
    queryKey: ["wallet", "portfolio-advice", address, portfolioTokens, balanceHistory],
    queryFn: () =>
      aiApi.portfolioAdvice({
        portfolio: portfolioTokens.map((token) => ({
          symbol: token.symbol,
          balance: token.balance,
          value: token.usdValue,
          change24h: token.change,
        })),
        historicalData: balanceHistory,
      }),
    enabled: Boolean(address) && portfolioTokens.length > 0,
  });

  const portfolioChange = useMemo(() => {
    if (balanceHistory.length < 2) {
      return portfolioTokens.reduce((sum, token) => sum + token.change, 0) / Math.max(portfolioTokens.length, 1);
    }
    const first = balanceHistory[0]?.value || 0;
    const last = balanceHistory.at(-1)?.value || 0;
    return first ? ((last - first) / first) * 100 : 0;
  }, [balanceHistory, portfolioTokens]);

  const walletAgeLabel = useMemo(() => {
    if (!authUser?.createdAt) {
      return "New wallet profile";
    }
    const diffDays = Math.max(
      1,
      Math.round((Date.now() - new Date(authUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    );
    return `${diffDays} day wallet age`;
  }, [authUser?.createdAt]);

  const activityLabel = useMemo(() => {
    if (transactions.length >= 8) {
      return "High activity";
    }
    if (transactions.length >= 4) {
      return "Moderate activity";
    }
    return "Low activity";
  }, [transactions.length]);

  const lockedBalance = useMemo(
    () => Number(((balanceQuery.data?.balanceSol || 0) * 0.18).toFixed(4)),
    [balanceQuery.data?.balanceSol],
  );

  const latencyMs = useMemo(() => {
    switch (gasOptimizationQuery.data?.congestionLevel) {
      case "Low":
        return 380;
      case "Moderate":
        return 620;
      case "High":
        return 980;
      default:
        return 540;
    }
  }, [gasOptimizationQuery.data?.congestionLevel]);

  const transactionSpeed = useMemo(() => {
    switch (gasOptimizationQuery.data?.congestionLevel) {
      case "Low":
        return "Fast";
      case "Moderate":
        return "Stable";
      case "High":
        return "Delayed";
      default:
        return "Syncing";
    }
  }, [gasOptimizationQuery.data?.congestionLevel]);

  const protocolStatuses = useMemo(
    () =>
      [
        stakingConfigQuery.data?.program,
        liquidityPoolsQuery.data?.program,
        lendingMarketQuery.data?.program,
        governanceConfigQuery.data?.program,
      ].filter((status): status is OnChainProgramStatus => Boolean(status)),
    [
      governanceConfigQuery.data?.program,
      lendingMarketQuery.data?.program,
      liquidityPoolsQuery.data?.program,
      stakingConfigQuery.data?.program,
    ],
  );

  const onChainSummary = useMemo(() => {
    const stakingPositions = stakingPositionsQuery.data || [];
    const liquidityPositions = liquidityPositionsQuery.data || [];
    const lendingPosition = lendingPositionQuery.data;
    const proposals = governanceProposalsQuery.data || [];

    return {
      stakingTotal: stakingPositions.reduce((sum, position) => sum + position.amount, 0),
      pendingRewards: stakingPositions.reduce((sum, position) => sum + (position.pendingRewards || 0), 0),
      stakingPositionsCount: stakingPositions.length,
      liquidityPositionsCount: liquidityPositions.length,
      totalLpBalance: liquidityPositions.reduce((sum, position) => sum + position.lpAmount, 0),
      liquidityPoolCount: liquidityPoolsQuery.data?.pools.length || 0,
      collateralAmount: lendingPosition?.collateralAmount || 0,
      borrowedAmount: lendingPosition?.borrowedAmount || 0,
      healthFactor: lendingPosition?.healthFactor || 0,
      governanceProposalCount: proposals.length,
      activeGovernanceProposals: proposals.filter((proposal) => proposal.status === "active").length,
      totalGovernanceVotes: proposals.reduce(
        (sum, proposal) => sum + proposal.yesVotes + proposal.noVotes + proposal.abstainVotes,
        0,
      ),
    };
  }, [
    governanceProposalsQuery.data,
    lendingPositionQuery.data,
    liquidityPoolsQuery.data?.pools.length,
    liquidityPositionsQuery.data,
    stakingPositionsQuery.data,
  ]);

  return {
    wallet,
    connected,
    address,
    providerName,
    authUser,
    network: "Devnet",
    autoRefreshEnabled,
    balanceQuery,
    portfolioQuery,
    transactionsQuery,
    nftQuery,
    insightsQuery,
    addressBookQuery,
    walletScoreQuery,
    gasOptimizationQuery,
    alertsQuery,
    portfolioAdviceQuery,
    portfolioTokens,
    balanceHistory,
    transactions,
    addressBook,
    alerts,
    portfolioChange,
    walletAgeLabel,
    activityLabel,
    lockedBalance,
    latencyMs,
    transactionSpeed,
    stakingConfigQuery,
    stakingPositionsQuery,
    liquidityPoolsQuery,
    liquidityPositionsQuery,
    lendingMarketQuery,
    lendingPositionQuery,
    governanceConfigQuery,
    governanceProposalsQuery,
    protocolStatuses,
    onChainSummary,
  };
}
