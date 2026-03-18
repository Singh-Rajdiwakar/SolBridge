"use client";

import { useQuery } from "@tanstack/react-query";

import { socialApi } from "@/services/api";

export function useTrendingWallets(limit = 8) {
  return useQuery({
    queryKey: ["social", "trending", limit],
    queryFn: () => socialApi.trending(limit),
  });
}
