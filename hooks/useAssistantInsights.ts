"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { assistantService } from "@/services/assistantService";
import { useAuthStore } from "@/store/auth-store";

export function useAssistantInsights(walletAddress?: string) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const effectiveWalletAddress = walletAddress || authUser?.walletAddress || "";

  const summaryQuery = useQuery({
    queryKey: ["assistant", "summary", effectiveWalletAddress],
    queryFn: () => assistantService.summary(effectiveWalletAddress),
    enabled: Boolean(effectiveWalletAddress),
    staleTime: 1000 * 45,
  });

  const historyQuery = useQuery({
    queryKey: ["assistant", "history", effectiveWalletAddress],
    queryFn: () => assistantService.history(effectiveWalletAddress),
    enabled: Boolean(effectiveWalletAddress),
    staleTime: 1000 * 60,
  });

  const refreshMutation = useMutation({
    mutationFn: () => assistantService.refresh(effectiveWalletAddress),
    onSuccess: (data) => {
      queryClient.setQueryData(["assistant", "summary", effectiveWalletAddress], data);
      void queryClient.invalidateQueries({ queryKey: ["assistant", "history", effectiveWalletAddress] });
    },
  });

  const isLoading = useMemo(
    () => summaryQuery.isLoading || historyQuery.isLoading,
    [historyQuery.isLoading, summaryQuery.isLoading],
  );

  const refresh = async () => {
    if (!effectiveWalletAddress) {
      return null;
    }
    return refreshMutation.mutateAsync();
  };

  return {
    walletAddress: effectiveWalletAddress,
    summaryQuery,
    historyQuery,
    refreshMutation,
    isLoading,
    refresh,
  };
}
