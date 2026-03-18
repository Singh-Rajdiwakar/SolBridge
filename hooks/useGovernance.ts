"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useWalletState } from "@/hooks/useWalletState";
import {
  cancelProposal,
  castVote,
  createProposal,
  fetchGovernanceConfig,
  fetchProposals,
  fetchUserVoteRecord,
  finalizeProposal,
  updateGovernanceConfig,
} from "@/services/governanceProgramService";

export function useGovernance(activeProposalAddress?: string | null) {
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
    queryKey: ["governance-config"],
    queryFn: fetchGovernanceConfig,
  });

  const proposalsQuery = useQuery({
    queryKey: ["onchain-proposals"],
    queryFn: fetchProposals,
  });

  const voteRecordQuery = useQuery({
    queryKey: ["vote-record", activeProposalAddress, wallet.address],
    queryFn: () => fetchUserVoteRecord(activeProposalAddress!, wallet.address),
    enabled: Boolean(activeProposalAddress && wallet.address),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["governance-config"] });
    queryClient.invalidateQueries({ queryKey: ["onchain-proposals"] });
    queryClient.invalidateQueries({ queryKey: ["vote-record", activeProposalAddress, wallet.address] });
  };

  return {
    wallet,
    configQuery,
    proposalsQuery,
    voteRecordQuery,
    createProposalMutation: useMutation({
      mutationFn: (payload: {
        title: string;
        descriptionHash?: string;
        metadataUri?: string;
        startDate?: string;
        endDate?: string;
        startsAt?: string | number | Date;
        endsAt?: string | number | Date;
      }) => createProposal(payload, context),
      onSuccess: invalidate,
    }),
    castVoteMutation: useMutation({
      mutationFn: (payload: { proposal: string; voteType: "yes" | "no" | "abstain" | string }) =>
        castVote(payload, context),
      onSuccess: invalidate,
    }),
    finalizeProposalMutation: useMutation({
      mutationFn: (proposalAddress: string) => finalizeProposal(proposalAddress, context),
      onSuccess: invalidate,
    }),
    cancelProposalMutation: useMutation({
      mutationFn: (proposalAddress: string) => cancelProposal(proposalAddress, context),
      onSuccess: invalidate,
    }),
    updateGovernanceConfigMutation: useMutation({
      mutationFn: (payload: { quorumBps: number; votingDurationSeconds: number; proposalThreshold: number }) =>
        updateGovernanceConfig(payload, context),
      onSuccess: invalidate,
    }),
  };
}
