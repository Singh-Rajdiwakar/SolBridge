"use client";

import { useQuery } from "@tanstack/react-query";

import { socialApi } from "@/services/api";

export function useSocialProfile(walletAddress?: string) {
  return useQuery({
    queryKey: ["social", "profile", walletAddress],
    queryFn: () => socialApi.profile(walletAddress!),
    enabled: Boolean(walletAddress),
  });
}
