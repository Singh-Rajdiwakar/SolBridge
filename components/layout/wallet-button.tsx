"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Wallet } from "lucide-react";

import { useActiveWallet } from "@/hooks/use-active-wallet";
import { shortenAddress } from "@/lib/solana";
import { walletApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/utils/format";

export function WalletButton() {
  const { address, connected, providerName, openConnectModal } = useActiveWallet();
  const balanceQuery = useQuery({
    queryKey: ["navbar", "wallet-balance", address, providerName],
    queryFn: () => walletApi.balance(address!, providerName || "Retix Wallet"),
    enabled: Boolean(address && connected),
  });

  return (
    <Button
      variant="secondary"
      className="hidden min-w-[11.5rem] justify-between px-3 lg:inline-flex lg:min-w-[12.25rem] 2xl:min-w-[13.5rem]"
      onClick={openConnectModal}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(242,201,76,0.16)] bg-[rgba(242,201,76,0.08)] text-[11px] font-semibold text-[#f3d57c]">
          <Wallet className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate text-[11px] uppercase tracking-[0.16em] text-[#8e877b]">
            {connected ? providerName || "Retix Wallet" : "Wallet"}
          </span>
          <span className="block truncate text-sm font-medium text-white">
            {connected ? `${formatNumber(balanceQuery.data?.balanceSol || 0, 4)} SOL` : "Connect Wallet"}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-2 text-[#c9c4bb]">
        <span className="hidden 2xl:inline">{connected ? shortenAddress(address) : null}</span>
        <ChevronDown className="h-4 w-4" />
      </span>
    </Button>
  );
}
