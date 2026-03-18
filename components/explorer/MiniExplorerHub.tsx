"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, DatabaseZap, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, SectionHeader } from "@/components/shared";
import { Tabs } from "@/components/ui/tabs";
import { addressBookApi, explorerApi, userApi } from "@/services/api";
import type {
  ExplorerBlockResult,
  ExplorerSearchType,
  ExplorerTokenResult,
  ExplorerTransactionResult,
  ExplorerWalletResult,
} from "@/types";
import {
  getExplorerSearchPlaceholder,
  getRecentExplorerSearches,
  saveRecentExplorerSearch,
  validateExplorerQuery,
} from "@/lib/solana/explorerService";
import { EmptyStateBlock } from "@/components/wallet/EmptyStateBlock";
import { ExplorerQuickActions } from "@/components/explorer/ExplorerQuickActions";
import { ExplorerSearchBar } from "@/components/explorer/ExplorerSearchBar";
import { ExplorerSearchTabs } from "@/components/explorer/ExplorerSearchTabs";
import { WalletExplorerCard } from "@/components/explorer/WalletExplorerCard";
import { TransactionExplorerCard } from "@/components/explorer/TransactionExplorerCard";
import { TokenMintExplorerCard } from "@/components/explorer/TokenMintExplorerCard";
import { BlockViewerCard } from "@/components/explorer/BlockViewerCard";
import { TransactionDetailsPanel } from "@/components/explorer/TransactionDetailsPanel";
import { WalletInteractionGraph } from "@/components/explorer/WalletInteractionGraph";
import { TransactionFlowMap } from "@/components/explorer/TransactionFlowMap";
import { RecentExplorerTransactionsTable } from "@/components/explorer/RecentExplorerTransactionsTable";

type SubmittedSearch = {
  type: ExplorerSearchType;
  value: string;
};

export function MiniExplorerHub() {
  const [searchType, setSearchType] = useState<ExplorerSearchType>("wallet");
  const [query, setQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState<SubmittedSearch | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState(getRecentExplorerSearches());

  useEffect(() => {
    setRecentSearches(getRecentExplorerSearches());
  }, []);

  const walletQuery = useQuery({
    queryKey: ["explorer", "wallet", submittedSearch?.value],
    queryFn: () => explorerApi.wallet(submittedSearch!.value),
    enabled: submittedSearch?.type === "wallet",
    retry: false,
    staleTime: 1000 * 30,
  });

  const transactionQuery = useQuery({
    queryKey: ["explorer", "transaction", submittedSearch?.value],
    queryFn: () => explorerApi.transaction(submittedSearch!.value),
    enabled: submittedSearch?.type === "transaction",
    retry: false,
    staleTime: 1000 * 30,
  });

  const tokenQuery = useQuery({
    queryKey: ["explorer", "token", submittedSearch?.value],
    queryFn: () => explorerApi.token(submittedSearch!.value),
    enabled: submittedSearch?.type === "token",
    retry: false,
    staleTime: 1000 * 60,
  });

  const blockQuery = useQuery({
    queryKey: ["explorer", "block", submittedSearch?.value],
    queryFn: () => explorerApi.block(submittedSearch!.value),
    enabled: submittedSearch?.type === "block",
    retry: false,
    staleTime: 1000 * 60,
  });

  const walletGraphQuery = useQuery({
    queryKey: ["explorer", "wallet-graph", submittedSearch?.value],
    queryFn: () => explorerApi.walletGraph(submittedSearch!.value),
    enabled: submittedSearch?.type === "wallet" && walletQuery.isSuccess,
    retry: false,
    staleTime: 1000 * 45,
  });

  const transactionFlowQuery = useQuery({
    queryKey: ["explorer", "tx-flow", submittedSearch?.value],
    queryFn: () => explorerApi.transactionFlow(submittedSearch!.value),
    enabled: submittedSearch?.type === "transaction" && transactionQuery.isSuccess,
    retry: false,
    staleTime: 1000 * 45,
  });

  const saveWalletMutation = useMutation({
    mutationFn: async (wallet: ExplorerWalletResult) =>
      userApi.linkWallet({
        address: wallet.walletAddress,
        provider: "retix",
        label: wallet.addressLabel,
        notes: wallet.note,
        favorite: true,
      }),
    onSuccess: () => toast.success("Wallet saved to your linked wallets."),
    onError: (error: Error) => toast.error(error.message),
  });

  const saveContactMutation = useMutation({
    mutationFn: async (wallet: ExplorerWalletResult) =>
      addressBookApi.create({
        name: wallet.addressLabel || "Explorer Wallet",
        walletAddress: wallet.walletAddress,
        network: "Devnet",
        notes: wallet.note || "Saved from Mini Explorer",
      }),
    onSuccess: () => toast.success("Wallet saved to address book."),
    onError: (error: Error) => toast.error(error.message),
  });

  const activeQuery = useMemo(() => {
    switch (submittedSearch?.type) {
      case "wallet":
        return walletQuery;
      case "transaction":
        return transactionQuery;
      case "token":
        return tokenQuery;
      case "block":
        return blockQuery;
      default:
        return null;
    }
  }, [blockQuery, submittedSearch?.type, tokenQuery, transactionQuery, walletQuery]);

  const currentResult = (activeQuery?.data || null) as
    | ExplorerWalletResult
    | ExplorerTransactionResult
    | ExplorerTokenResult
    | ExplorerBlockResult
    | null;

  const currentError =
    activeQuery?.error instanceof Error ? activeQuery.error.message : null;
  const isSearching = Boolean(activeQuery?.isFetching);

  const handleSubmit = () => {
    const error = validateExplorerQuery(searchType, query);
    if (error) {
      setValidationError(error);
      return;
    }

    const nextSearch = {
      type: searchType,
      value: query.trim(),
    } satisfies SubmittedSearch;

    setValidationError(null);
    setSubmittedSearch(nextSearch);
    setRecentSearches(
      saveRecentExplorerSearch({
        ...nextSearch,
        savedAt: new Date().toISOString(),
      }),
    );
  };

  const renderResultCard = () => {
    if (!currentResult) {
      return (
        <EmptyStateBlock
          title="Mini Explorer ready"
          description="Search a wallet, transaction signature, token mint, or slot to inspect live Solana Devnet activity without leaving the dashboard."
          icon={<DatabaseZap className="h-5 w-5" />}
        />
      );
    }

    switch (currentResult.queryType) {
      case "wallet":
        return <WalletExplorerCard result={currentResult} />;
      case "transaction":
        return <TransactionExplorerCard result={currentResult} />;
      case "token":
        return <TokenMintExplorerCard result={currentResult} />;
      case "block":
        return <BlockViewerCard result={currentResult} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="space-y-5">
        <SectionHeader
          title="Mini Explorer"
          subtitle="Internal Solana inspection workspace for wallet verification, transaction debugging, token transparency, and slot-level visibility."
        />

        <Tabs value={searchType} onValueChange={(value) => setSearchType(value as ExplorerSearchType)} className="space-y-4">
          <ExplorerSearchTabs />
        </Tabs>

        <ExplorerSearchBar
          searchType={searchType}
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSubmit}
          isLoading={isSearching}
          placeholder={getExplorerSearchPlaceholder(searchType)}
          error={validationError}
          recentSearches={recentSearches}
          onRecentSearchSelect={(item) => {
            setSearchType(item.type);
            setQuery(item.value);
            setValidationError(null);
            setSubmittedSearch({ type: item.type, value: item.value });
          }}
        />
      </GlassCard>

      {currentError ? (
        <EmptyStateBlock
          title="Explorer lookup failed"
          description={currentError}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      ) : null}

      {isSearching ? (
        <GlassCard className="flex min-h-[240px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
            Fetching on-chain explorer data...
          </div>
        </GlassCard>
      ) : null}

      {!isSearching ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {renderResultCard()}

            {currentResult?.queryType === "transaction" ? (
              <TransactionDetailsPanel result={currentResult} />
            ) : (
              <RecentExplorerTransactionsTable
                items={
                  currentResult?.queryType === "wallet"
                    ? currentResult.recentTransactions
                    : currentResult?.queryType === "block"
                      ? currentResult.signatures.map((signature) => ({
                          signature: signature.signature,
                          shortSignature: signature.shortSignature,
                          slot: currentResult.slot,
                          blockTime: currentResult.blockTime,
                          status: signature.status,
                          protocolModule: "block",
                          type: "Block Signature",
                          amount: 0,
                          tokenSymbol: "SOL",
                          explorerUrl: signature.explorerUrl,
                        }))
                      : []
                }
              />
            )}
          </div>

          <div className="space-y-6">
            {currentResult ? (
              <ExplorerQuickActions
                title={
                  currentResult.queryType === "wallet"
                    ? "Wallet Address"
                    : currentResult.queryType === "transaction"
                      ? "Transaction Signature"
                      : currentResult.queryType === "token"
                        ? "Token Mint"
                        : "Block Slot"
                }
                identifier={
                  currentResult.queryType === "wallet"
                    ? currentResult.walletAddress
                    : currentResult.queryType === "transaction"
                      ? currentResult.signature
                      : currentResult.queryType === "token"
                        ? currentResult.mintAddress
                        : String(currentResult.slot)
                }
                explorerUrl={currentResult.explorerUrl}
                verified={currentResult.verifiedOnChain}
                tags={
                  currentResult.queryType === "wallet"
                    ? currentResult.tags
                    : currentResult.queryType === "transaction"
                      ? [currentResult.protocolClassification]
                      : currentResult.queryType === "token"
                        ? [currentResult.knownByApp ? "Known Token" : "Mint Only"]
                        : ["Slot Viewer"]
                }
                onSaveWallet={
                  currentResult.queryType === "wallet"
                    ? async () => {
                        await saveWalletMutation.mutateAsync(currentResult);
                      }
                    : undefined
                }
                onSaveContact={
                  currentResult.queryType === "wallet"
                    ? async () => {
                        await saveContactMutation.mutateAsync(currentResult);
                      }
                    : undefined
                }
              />
            ) : null}

            {submittedSearch?.type === "wallet" ? (
              <WalletInteractionGraph
                graph={walletGraphQuery.data}
                onNodeSelect={(address) => {
                  setSearchType("wallet");
                  setQuery(address);
                  setValidationError(null);
                  setSubmittedSearch({ type: "wallet", value: address });
                  setRecentSearches(
                    saveRecentExplorerSearch({
                      type: "wallet",
                      value: address,
                      savedAt: new Date().toISOString(),
                    }),
                  );
                }}
              />
            ) : (
              <TransactionFlowMap flow={transactionFlowQuery.data} />
            )}

            {currentResult?.queryType === "wallet" ? (
              <GlassCard className="space-y-4">
                <SectionHeader title="Wallet Search Intelligence" subtitle="Quick drill-down metrics for relationship tracing and explorer demos." />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SmallMetric
                    label="Top Counterparty"
                    value={currentResult.relatedEntityDiscovery.topInteractionWallet?.label || "--"}
                  />
                  <SmallMetric
                    label="Largest Recent Tx"
                    value={
                      currentResult.relatedEntityDiscovery.largestRecentTransaction
                        ? `${currentResult.relatedEntityDiscovery.largestRecentTransaction.amount} ${currentResult.relatedEntityDiscovery.largestRecentTransaction.tokenSymbol}`
                        : "--"
                    }
                  />
                </div>
              </GlassCard>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3 text-base font-semibold text-white">{value}</div>
    </div>
  );
}
