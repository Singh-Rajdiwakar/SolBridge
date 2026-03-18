"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";

export function useBootstrapAuth() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: hydrated && Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      updateUser(query.data);
    }
  }, [query.data, updateUser]);

  useEffect(() => {
    if (query.isError) {
      clearAuth();
    }
  }, [clearAuth, query.isError]);

  return {
    token,
    user,
    hydrated,
    isLoading: query.isLoading && Boolean(token),
  };
}

export function useRequireAuth(options?: { adminOnly?: boolean }) {
  const router = useRouter();
  const { user, hydrated, isLoading } = useBootstrapAuth();

  useEffect(() => {
    if (!hydrated || isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (options?.adminOnly && user.role !== "admin") {
      router.replace("/dashboard/stake");
    }
  }, [hydrated, isLoading, options?.adminOnly, router, user]);

  return { user, hydrated, isLoading };
}
