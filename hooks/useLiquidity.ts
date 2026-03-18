"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useWalletState } from "@/hooks/useWalletState";
import {
  addLiquidity,
  fetchPools,
  fetchUserLiquidityPositions,
  pausePool,
  removeLiquidity,
  resumePool,
  setPoolFee,
  swapTokens,
} from "@/services/liquidityProgramService";

export function useLiquidity() {
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

  const poolsQuery = useQuery({
    queryKey: ["onchain-pools"],
    queryFn: fetchPools,
  });

  const positionsQuery = useQuery({
    queryKey: ["user-liquidity-positions", wallet.address],
    queryFn: () => fetchUserLiquidityPositions(wallet.address),
    enabled: Boolean(wallet.address),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["onchain-pools"] });
    queryClient.invalidateQueries({ queryKey: ["user-liquidity-positions", wallet.address] });
  };

  return {
    wallet,
    poolsQuery,
    positionsQuery,
    addLiquidityMutation: useMutation({
      mutationFn: (payload: { poolAddress: string; amountA: number; amountB: number; minLpOut?: number }) =>
        addLiquidity(payload, context),
      onSuccess: invalidate,
    }),
    removeLiquidityMutation: useMutation({
      mutationFn: (payload: { poolAddress: string; lpAmount: number }) => removeLiquidity(payload, context),
      onSuccess: invalidate,
    }),
    swapMutation: useMutation({
      mutationFn: (payload: { poolAddress: string; fromMint: string; toMint: string; amountIn: number; minOut?: number }) =>
        swapTokens(payload, context),
      onSuccess: invalidate,
    }),
    pausePoolMutation: useMutation({
      mutationFn: (poolAddress: string) => pausePool(poolAddress, context),
      onSuccess: invalidate,
    }),
    resumePoolMutation: useMutation({
      mutationFn: (poolAddress: string) => resumePool(poolAddress, context),
      onSuccess: invalidate,
    }),
    setPoolFeeMutation: useMutation({
      mutationFn: (payload: { poolAddress: string; feeRateBps: number }) => setPoolFee(payload, context),
      onSuccess: invalidate,
    }),
  };
}

