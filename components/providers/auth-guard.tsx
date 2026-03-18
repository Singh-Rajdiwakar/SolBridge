"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { useRequireAuth } from "@/hooks/use-auth";

export function AuthGuard({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, hydrated, isLoading } = useRequireAuth({ adminOnly });

  if (!hydrated || isLoading || !user || (adminOnly && user.role !== "admin")) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-panel-strong flex items-center gap-3 px-6 py-4 text-sm text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />
          Preparing SolanaBlocks session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
