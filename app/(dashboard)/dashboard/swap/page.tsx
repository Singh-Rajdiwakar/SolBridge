"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { NetworkPerformanceCard, SwapPanel, TransactionHistory, TransactionStatusCard } from "@/components/wallet";
import { GlassCard, SectionHeader } from "@/components/shared";
import { useWalletData } from "@/hooks/use-wallet-data";
import { DEFAULT_SOL_FEE } from "@/lib/solana";
import { poolsApi, walletApi } from "@/services/api";
import { formatCurrency, formatNumber } from "@/utils/format";

type SwapDraft = {
  fromToken: string;
  toToken: string;
  amount: number;
  slippage: number;
};

type ExecutionState = {
  status: "Pending" | "Confirmed" | "Failed";
  title: string;
  signature?: string | null;
  timestamp?: string | null;
};

export default function SwapPage() {
  const {
    wallet,
    connected,
    address,
    providerName,
    portfolioTokens,
    transactions,
    gasOptimizationQuery,
    latencyMs,
  } = useWalletData();
  const [swapDraft, setSwapDraft] = useState<SwapDraft>({
    fromToken: "SOL",
    toToken: "USDC",
    amount: 0.5,
    slippage: 0.5,
  });
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);

  const poolsQuery = useQuery({
    queryKey: ["wallet-swap", "pools"],
    queryFn: () => poolsApi.list(),
  });

  const positionsQuery = useQuery({
    queryKey: ["wallet-swap", "positions"],
    queryFn: () => poolsApi.positions(),
    enabled: connected,
  });

  const swapPreviewQuery = useQuery({
    queryKey: ["wallet-swap", "preview", address, providerName, swapDraft],
    queryFn: () =>
      walletApi.swap({
        address: address!,
        provider: providerName || "Retix Wallet",
        mode: "preview",
        ...swapDraft,
      }),
    enabled: Boolean(address) && swapDraft.amount > 0 && swapDraft.fromToken !== swapDraft.toToken,
  });

  const swapMutation = useMutation({
    onMutate: () => {
      setExecutionState({
        status: "Pending",
        title: "Executing swap simulation",
        timestamp: new Date().toISOString(),
      });
    },
    mutationFn: async (values: SwapDraft) => {
      if (!address) {
        throw new Error("Connect a wallet first.");
      }

      return walletApi.swap({
        address,
        provider: providerName || "Retix Wallet",
        mode: "execute",
        ...values,
      });
    },
    onSuccess: (result) => {
      setExecutionState({
        status: "Confirmed",
        title: "Swap simulation confirmed",
        signature: result.transaction?.signature,
        timestamp: new Date().toISOString(),
      });
      toast.success("Swap preview confirmed");
    },
    onError: (error: unknown) => {
      setExecutionState({
        status: "Failed",
        title: "Swap simulation failed",
        timestamp: new Date().toISOString(),
      });
      toast.error(error instanceof Error ? error.message : "Swap failed");
    },
  });

  const swapTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type.toLowerCase().includes("swap")),
    [transactions],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="DeFi / Swap"
        subtitle="Token swaps, fee-aware route previews, and quick visibility into liquidity pools and wallet positions."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/pools" className={buttonVariants({ variant: "secondary" })}>
              <ArrowUpRight className="h-4 w-4" />
              Open Pools
            </Link>
            <Button onClick={wallet.openConnectModal}>
              <Wallet className="h-4 w-4" />
              {connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="space-y-6">
          <TransactionStatusCard
            state={executionState}
            onCopySignature={async (signature) => {
              await navigator.clipboard.writeText(signature);
              toast.success("Signature copied");
            }}
          />
          <SwapPanel
            connected={connected}
            tokens={portfolioTokens}
            preview={swapPreviewQuery.data}
            previewLoading={swapPreviewQuery.isFetching}
            loading={swapMutation.isPending}
            onPreview={(values) => setSwapDraft(values)}
            onSwap={async (values) => {
              await swapMutation.mutateAsync(values);
            }}
          />
          <TransactionHistory transactions={swapTransactions} loading={false} />
        </div>

        <div className="space-y-6">
          <NetworkPerformanceCard
            latencyMs={latencyMs}
            feeEstimate={gasOptimizationQuery.data?.currentFee || DEFAULT_SOL_FEE}
          />

          <GlassCard>
            <SectionHeader
              title="Liquidity Pools"
              subtitle="Structured pool visibility for recruiter-facing DeFi breadth."
            />
            <div className="space-y-3">
              {(poolsQuery.data || []).slice(0, 5).map((pool) => (
                <div key={pool._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{pool.pair}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        APR {formatNumber(pool.apr, 2)}% • Fee {formatNumber(pool.feePercent, 2)}%
                      </div>
                    </div>
                    <Link href="/dashboard/pools" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                      Add Liquidity
                    </Link>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-white/10 bg-[#0b1324] p-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">TVL</div>
                      <div className="mt-2 text-sm font-semibold text-white">{formatCurrency(pool.totalLiquidity)}</div>
                    </div>
                    <div className="rounded-md border border-white/10 bg-[#0b1324] p-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">24h Volume</div>
                      <div className="mt-2 text-sm font-semibold text-white">{formatCurrency(pool.volume24h)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader
              title="My Liquidity Positions"
              subtitle="Snapshot of existing LP exposure connected to the active user."
            />
            <div className="space-y-3">
              {(positionsQuery.data || []).length > 0 ? (
                positionsQuery.data?.map((position) => (
                  <div key={position._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-sm font-semibold text-white">{position.pair || "Liquidity Position"}</div>
                    <div className="mt-2 text-sm text-slate-400">
                      LP Balance {formatNumber(position.lpTokens, 4)} • Fees Earned {formatCurrency(position.feesEarned)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
                  No active liquidity positions yet.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
