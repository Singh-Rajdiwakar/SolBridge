"use client";

import { BrainCircuit, Wallet } from "lucide-react";

import { AssistantHub } from "@/components/assistant";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { useActiveWallet } from "@/hooks/use-active-wallet";
import { useAuthStore } from "@/store/auth-store";

export default function AssistantPage() {
  const wallet = useActiveWallet();
  const authUser = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Financial Assistant"
        subtitle="Explainable portfolio guidance layered on top of wallet analytics, risk scoring, strategy simulation, and protocol exposure intelligence."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">
              <BrainCircuit className="h-4 w-4" />
              Rule-Based Insights
            </Button>
            <Button onClick={wallet.openConnectModal}>
              <Wallet className="h-4 w-4" />
              {wallet.connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      <AssistantHub walletAddress={wallet.address || authUser?.walletAddress} />
    </div>
  );
}
