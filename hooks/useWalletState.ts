"use client";

import { useActiveWallet } from "@/hooks/use-active-wallet";

export function useWalletState() {
  return useActiveWallet();
}

