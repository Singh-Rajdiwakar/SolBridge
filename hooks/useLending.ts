"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useWalletState } from "@/hooks/useWalletState";
import {
  borrow,
  depositCollateral,
  fetchLendingMarkets,
  fetchUserPosition,
  pauseMarket,
  repay,
  resumeMarket,
  updateMarketParams,
  withdraw,
} from "@/services/lendingProgramService";

export function useLending() {
  const queryClient = useQueryClient();
  const wallet = useWalletState();
  const context = useMemo(
    () => ({
      connection: wallet.connection,
      publicKey: wallet.publicKey!,
      anchorWallet: wallet.anchorWallet,
      address: wallet.address,
      providerName: wallet.providerName,
    }),
    [wallet.address, wallet.anchorWallet, wallet.connection, wallet.providerName, wallet.publicKey],
  );

  const marketsQuery = useQuery({
    queryKey: ["lending-market"],
    queryFn: fetchLendingMarkets,
  });

  const positionQuery = useQuery({
    queryKey: ["lending-position", wallet.address],
    queryFn: () => fetchUserPosition(wallet.address),
    enabled: Boolean(wallet.address),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["lending-market"] });
    queryClient.invalidateQueries({ queryKey: ["lending-position", wallet.address] });
  };

  return {
    wallet,
    marketsQuery,
    positionQuery,
    depositMutation: useMutation({
      mutationFn: (payload: { amount: number; marketAddress?: string }) => depositCollateral(payload, context),
      onSuccess: invalidate,
    }),
    borrowMutation: useMutation({
      mutationFn: (payload: { amount: number; marketAddress?: string }) => borrow(payload, context),
      onSuccess: invalidate,
    }),
    repayMutation: useMutation({
      mutationFn: (payload: { amount: number; marketAddress?: string }) => repay(payload, context),
      onSuccess: invalidate,
    }),
    withdrawMutation: useMutation({
      mutationFn: (payload: { amount: number; marketAddress?: string }) => withdraw(payload, context),
      onSuccess: invalidate,
    }),
    pauseMarketMutation: useMutation({
      mutationFn: (marketAddress: string) => pauseMarket(marketAddress, context),
      onSuccess: invalidate,
    }),
    resumeMarketMutation: useMutation({
      mutationFn: (marketAddress: string) => resumeMarket(marketAddress, context),
      onSuccess: invalidate,
    }),
    updateMarketMutation: useMutation({
      mutationFn: (payload: {
        marketAddress: string;
        collateralFactorBps: number;
        liquidationThresholdBps: number;
        borrowInterestBps: number;
        protocolFeeBps: number;
        paused: boolean;
      }) => updateMarketParams(payload, context),
      onSuccess: invalidate,
    }),
  };
}

