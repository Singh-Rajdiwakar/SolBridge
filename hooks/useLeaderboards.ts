"use client";

import { useQuery } from "@tanstack/react-query";

import { socialApi } from "@/services/api";

export function useLeaderboards(period: "today" | "7d" | "30d" | "all" = "7d") {
  return useQuery({
    queryKey: ["social", "leaderboards", period],
    queryFn: () => socialApi.leaderboards(period),
  });
}
