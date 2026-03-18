"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useWalletState } from "@/hooks/useWalletState";
import {
  claimRewards,
  createLockPeriodOnChain,
  fetchLockPeriods,
  fetchStakingConfig,
  fetchUserStakePositions,
  pauseStaking,
  resumeStaking,
  stakeTokens,
  unstakeTokens,
  updateLockPeriodOnChain,
} from "@/services/stakingProgramService";

export function useStaking() {
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

  const configQuery = useQuery({
    queryKey: ["staking-config"],
    queryFn: fetchStakingConfig,
  });

  const lockPeriodsQuery = useQuery({
    queryKey: ["staking-lock-periods"],
    queryFn: fetchLockPeriods,
  });

  const positionsQuery = useQuery({
    queryKey: ["user-stakes", wallet.address],
    queryFn: () => fetchUserStakePositions(wallet.address),
    enabled: Boolean(wallet.address),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["staking-config"] });
    queryClient.invalidateQueries({ queryKey: ["staking-lock-periods"] });
    queryClient.invalidateQueries({ queryKey: ["user-stakes", wallet.address] });
  };

  const stakeMutation = useMutation({
    mutationFn: (payload: { amount: number; lockPeriod: number }) => stakeTokens(payload, context),
    onSuccess: invalidate,
  });

  const claimMutation = useMutation({
    mutationFn: (positionPda: string) => claimRewards(positionPda, context),
    onSuccess: invalidate,
  });

  const unstakeMutation = useMutation({
    mutationFn: (positionPda: string) => unstakeTokens(positionPda, context),
    onSuccess: invalidate,
  });

  const pauseMutation = useMutation({
    mutationFn: () => pauseStaking(context),
    onSuccess: invalidate,
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeStaking(context),
    onSuccess: invalidate,
  });

  const createLockPeriodMutation = useMutation({
    mutationFn: (payload: {
      label: string;
      durationDays: number;
      apyBps: number;
      minAmount: number;
      earlyUnstakePenaltyBps: number;
      earlyUnstakeEnabled: boolean;
    }) => createLockPeriodOnChain(payload, context),
    onSuccess: invalidate,
  });

  const updateLockPeriodMutation = useMutation({
    mutationFn: (payload: {
      durationDays: number;
      apyBps: number;
      minAmount: number;
      earlyUnstakePenaltyBps: number;
      earlyUnstakeEnabled: boolean;
      enabled: boolean;
    }) => updateLockPeriodOnChain(payload, context),
    onSuccess: invalidate,
  });

  return {
    wallet,
    configQuery,
    lockPeriodsQuery,
    positionsQuery,
    isAdmin:
      Boolean(wallet.address) &&
      wallet.address === configQuery.data?.admin,
    stakeMutation,
    claimMutation,
    unstakeMutation,
    pauseMutation,
    resumeMutation,
    createLockPeriodMutation,
    updateLockPeriodMutation,
  };
}

