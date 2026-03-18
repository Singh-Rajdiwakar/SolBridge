"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { createQueryClient } from "@/lib/query-client";
import { SolanaWalletProvider } from "@/components/providers/solana-wallet-provider";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <SolanaWalletProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <WalletConnectModal />
          <Toaster
            position="top-right"
            richColors
            theme="dark"
            toastOptions={{
              className: "rounded-md border border-cyan-400/20 bg-[rgba(10,16,32,0.98)] text-slate-100",
            }}
          />
        </QueryClientProvider>
      </SolanaWalletProvider>
    </ThemeProvider>
  );
}
