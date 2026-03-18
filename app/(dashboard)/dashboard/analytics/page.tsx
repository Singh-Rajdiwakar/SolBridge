"use client";

import { useMemo } from "react";
import { BarChart3, BrainCircuit, ReceiptText, Wallet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { WalletAnalyticsOverview } from "@/components/analytics/WalletAnalyticsOverview";
import { AssistantHub } from "@/components/assistant";
import { CrossWalletAnalyticsHub } from "@/components/cross-wallet";
import { PageHeader } from "@/components/dashboard/page-header";
import { FilterTabs } from "@/components/shared";
import { StrategyBuilderHub } from "@/components/strategy";
import { TaxReportsHub } from "@/components/tax";
import { Button } from "@/components/ui/button";
import { useActiveWallet } from "@/hooks/use-active-wallet";

export default function AnalyticsPage() {
  const wallet = useActiveWallet();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "cross-wallet" ||
      tab === "tax-reports" ||
      tab === "ai-assistant" ||
      tab === "strategy-builder"
    ) {
      return tab;
    }
    return "overview";
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet Analytics Hub"
        subtitle="Single-wallet analytics, cross-wallet portfolio intelligence, AI assistant guidance, and tax-grade reporting now live inside one production-grade Solana analytics surface."
        action={
          <div className="flex flex-wrap gap-3">
            <FilterTabs
              items={[
                { label: "Overview", value: "overview" },
                { label: "Strategy Builder", value: "strategy-builder" },
                { label: "Cross-Wallet", value: "cross-wallet" },
                { label: "AI Assistant", value: "ai-assistant" },
                { label: "Tax Reports", value: "tax-reports" },
              ]}
              active={activeTab}
              onChange={(value) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("tab", value);
                router.replace(`/dashboard/analytics?${params.toString()}`);
              }}
            />
            <Button variant="secondary">
              {activeTab === "tax-reports" ? (
                <ReceiptText className="h-4 w-4" />
              ) : activeTab === "strategy-builder" ? (
                <BarChart3 className="h-4 w-4" />
              ) : activeTab === "ai-assistant" ? (
                <BrainCircuit className="h-4 w-4" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              {activeTab === "cross-wallet"
                ? "Cross-Wallet Live"
                : activeTab === "strategy-builder"
                  ? "Strategy Engine Live"
                : activeTab === "ai-assistant"
                  ? "Assistant Live"
                : activeTab === "tax-reports"
                  ? "Tax Engine Live"
                  : "Analytics Live"}
            </Button>
            <Button onClick={wallet.openConnectModal}>
              <Wallet className="h-4 w-4" />
              {wallet.connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      {activeTab === "cross-wallet" ? (
        <CrossWalletAnalyticsHub />
      ) : activeTab === "strategy-builder" ? (
        <StrategyBuilderHub />
      ) : activeTab === "ai-assistant" ? (
        <AssistantHub walletAddress={wallet.address || undefined} />
      ) : activeTab === "tax-reports" ? (
        <TaxReportsHub />
      ) : (
        <WalletAnalyticsOverview />
      )}
    </div>
  );
}
