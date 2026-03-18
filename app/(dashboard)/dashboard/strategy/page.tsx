"use client";

import { SlidersHorizontal, Wallet } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StrategyBuilderHub } from "@/components/strategy";
import { Button } from "@/components/ui/button";
import { useActiveWallet } from "@/hooks/use-active-wallet";

export default function StrategyPage() {
  const wallet = useActiveWallet();

  return (
    <div className="space-y-6">
      <PageHeader
        title="DeFi Strategy Builder"
        subtitle="Model staking, liquidity, lending, governance, hold, and reserve allocations with protocol-aware yield, risk, volatility, stress testing, and strategy comparison."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">
              <SlidersHorizontal className="h-4 w-4" />
              Strategy Engine Live
            </Button>
            <Button onClick={wallet.openConnectModal}>
              <Wallet className="h-4 w-4" />
              {wallet.connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      <StrategyBuilderHub />
    </div>
  );
}
