"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { Shield, ShieldQuestion, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { PortfolioRiskHub } from "@/components/risk";
import { FilterTabs, FormField, GlassCard, SectionHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletData } from "@/hooks/use-wallet-data";
import { DEFAULT_SOL_FEE } from "@/lib/solana";
import { securityApi, simulatorApi } from "@/services/api";
import type { TransactionSimulationResponse } from "@/types";
import {
  AIAdvisorPanel,
  GasOptimizerWidget,
  NetworkPerformanceCard,
  SecurityAlertPanel,
  SecurityHudPanel,
  TransactionSimulatorModal,
  WalletRiskCard,
} from "@/components/wallet";
import { formatNumber } from "@/utils/format";

export default function SecurityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    wallet,
    connected,
    address,
    authUser,
    alerts,
    walletScoreQuery,
    gasOptimizationQuery,
    portfolioAdviceQuery,
    latencyMs,
  } = useWalletData();
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("0.1");
  const [simulation, setSimulation] = useState<TransactionSimulationResponse | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  const activeTab = useMemo(
    () => (searchParams.get("tab") === "portfolio-risk" ? "portfolio-risk" : "fraud-ai"),
    [searchParams],
  );
  const riskWalletAddress = address || authUser?.walletAddress;

  const receiverValid = useMemo(() => {
    try {
      if (!receiverAddress) {
        return false;
      }
      new PublicKey(receiverAddress);
      return true;
    } catch {
      return false;
    }
  }, [receiverAddress]);

  const riskCheckQuery = useQuery({
    queryKey: ["wallet-security", "check", address, receiverAddress, amount],
    queryFn: () =>
      securityApi.checkTransaction({
        walletAddress: address || undefined,
        receiverAddress,
        amount: Number(amount),
        token: "SOL",
      }),
    enabled: connected && receiverValid && Number(amount) > 0,
    retry: false,
  });

  const simulatorMutation = useMutation({
    mutationFn: () =>
      simulatorApi.transaction({
        kind: "send",
        walletAddress: address || undefined,
        receiverAddress,
        amount: Number(amount),
        token: "SOL",
      }),
    onSuccess: (result) => {
      setSimulation(result);
      setSimulatorOpen(true);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Simulation failed");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security / AI"
        subtitle="Portfolio risk analytics, wallet risk scoring, fraud detection, simulator tooling, gas optimization, and AI portfolio guidance."
        action={
          <div className="flex flex-wrap gap-3">
            <FilterTabs
              items={[
                { label: "Portfolio Risk", value: "portfolio-risk" },
                { label: "Fraud / AI", value: "fraud-ai" },
              ]}
              active={activeTab}
              onChange={(value) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("tab", value);
                router.replace(`/dashboard/security?${params.toString()}`);
              }}
            />
            <Button onClick={wallet.openConnectModal}>
              <Wallet className="h-4 w-4" />
              {connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      {activeTab === "portfolio-risk" ? (
        <PortfolioRiskHub walletAddress={riskWalletAddress} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-6">
            <SecurityHudPanel
              score={walletScoreQuery.data}
              optimization={gasOptimizationQuery.data}
              alerts={alerts}
            />

            <GlassCard>
              <SectionHeader
                title="Fraud Detection + Simulator"
                subtitle="Check suspicious addresses and simulate a send before signing."
                action={<ShieldQuestion className="h-4 w-4 text-cyan-300" />}
              />

              <div className="space-y-4">
                <FormField label="Receiver Address" htmlFor="security-check-address">
                  <Input
                    id="security-check-address"
                    value={receiverAddress}
                    onChange={(event) => setReceiverAddress(event.target.value)}
                    placeholder="Enter a Solana address"
                  />
                </FormField>

                <FormField label="Amount (SOL)" htmlFor="security-check-amount">
                  <Input
                    id="security-check-amount"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </FormField>

                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Address Risk Check</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {riskCheckQuery.data
                          ? `${riskCheckQuery.data.riskLevel} • ${formatNumber(riskCheckQuery.data.confidence, 0)}% confidence`
                          : "Waiting for valid input"}
                      </div>
                    </div>
                    <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      Retix AI
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-400">
                    {riskCheckQuery.data?.warnings?.length ? (
                      riskCheckQuery.data.warnings.map((warning) => <div key={warning}>{warning}</div>)
                    ) : (
                      <div>Enter a valid address and amount to trigger fraud detection.</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => simulatorMutation.mutate()}
                    disabled={!connected || !receiverValid || Number(amount) <= 0 || simulatorMutation.isPending}
                  >
                    <Sparkles className="h-4 w-4" />
                    {simulatorMutation.isPending ? "Simulating..." : "Run Transaction Simulator"}
                  </Button>
                  <Button variant="secondary" disabled>
                    <Shield className="h-4 w-4" />
                    Security Monitor Active
                  </Button>
                </div>
              </div>
            </GlassCard>

            <SecurityAlertPanel alerts={alerts} loading={false} />
          </div>

          <div className="space-y-6">
            <WalletRiskCard score={walletScoreQuery.data} loading={walletScoreQuery.isLoading && connected} />
            <GasOptimizerWidget
              optimization={gasOptimizationQuery.data}
              loading={gasOptimizationQuery.isLoading && connected}
            />
            <AIAdvisorPanel advice={portfolioAdviceQuery.data} loading={portfolioAdviceQuery.isLoading && connected} />
            <NetworkPerformanceCard
              latencyMs={latencyMs}
              feeEstimate={gasOptimizationQuery.data?.currentFee || DEFAULT_SOL_FEE}
            />
          </div>
        </div>
      )}

      <TransactionSimulatorModal
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        simulation={simulation}
        onConfirm={() => {
          setSimulatorOpen(false);
          toast.success("Simulation reviewed");
        }}
      />
    </div>
  );
}
