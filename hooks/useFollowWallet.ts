"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { socialApi } from "@/services/api";

export function useFollowWallet(walletAddress?: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["social"] }),
      walletAddress ? queryClient.invalidateQueries({ queryKey: ["social", "profile", walletAddress] }) : Promise.resolve(),
    ]);
  };

  const followMutation = useMutation({
    mutationFn: () => socialApi.follow(walletAddress!),
    onSuccess: async () => {
      await invalidate();
      toast.success("Wallet followed");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to follow wallet"),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => socialApi.unfollow(walletAddress!),
    onSuccess: async () => {
      await invalidate();
      toast.success("Wallet unfollowed");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to unfollow wallet"),
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    followAsync: followMutation.mutateAsync,
    unfollowAsync: unfollowMutation.mutateAsync,
    isPending: followMutation.isPending || unfollowMutation.isPending,
  };
}
