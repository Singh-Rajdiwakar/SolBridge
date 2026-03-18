"use client";

import { Wallet } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { PortfolioRiskHub } from "@/components/risk";
import { Button } from "@/components/ui/button";
import { useWalletData } from "@/hooks/use-wallet-data";

export default function RiskPage() {
  const { wallet, connected, address, authUser } = useWalletData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Management Engine"
        subtitle="Dedicated portfolio safety console for volatility, borrow, liquidity, and concentration analysis across your visible Solana exposure."
        action={
          <Button onClick={wallet.openConnectModal}>
            <Wallet className="h-4 w-4" />
            {connected ? "Switch Wallet" : "Connect Wallet"}
          </Button>
        }
      />

      <PortfolioRiskHub walletAddress={address || authUser?.walletAddress} />
    </div>
  );
}
