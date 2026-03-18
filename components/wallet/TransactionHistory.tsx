"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins, Copy, ExternalLink, History, ImageIcon, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, FilterTabs, GlassCard, LoadingSkeleton, SearchBar, SectionHeader, StatusBadge } from "@/components/shared";
import type { TransactionRecord } from "@/types";
import { buildExplorerUrl, shortenAddress } from "@/lib/solana";
import { formatDate, formatNumber } from "@/utils/format";

const transactionFilters = [
  { label: "All", value: "all" },
  { label: "Sent", value: "sent" },
  { label: "Received", value: "received" },
  { label: "Swaps", value: "swap" },
  { label: "Tokens", value: "mint" },
  { label: "NFTs", value: "nft" },
];

function transactionIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("received") || normalized.includes("airdrop")) {
    return ArrowDownLeft;
  }
  if (normalized.includes("swap")) {
    return RefreshCcw;
  }
  if (normalized.includes("token") || normalized.includes("mint")) {
    return Coins;
  }
  if (normalized.includes("nft")) {
    return ImageIcon;
  }
  return ArrowUpRight;
}

export function TransactionHistory({
  transactions,
  loading,
}: {
  transactions: TransactionRecord[];
  loading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const search = query.trim().toLowerCase();
        const matchesSearch =
          !search ||
          transaction.type.toLowerCase().includes(search) ||
          transaction.token.toLowerCase().includes(search) ||
          transaction.signature?.toLowerCase().includes(search);
        const matchesFilter =
          filter === "all" ||
          (filter === "sent" && transaction.type.toLowerCase().includes("sent")) ||
          (filter === "received" &&
            (transaction.type.toLowerCase().includes("received") || transaction.type.toLowerCase().includes("airdrop"))) ||
          (filter === "swap" && transaction.type === "Swap") ||
          (filter === "mint" && transaction.type.toLowerCase().includes("token")) ||
          (filter === "nft" && transaction.type.toLowerCase().includes("nft"));

        return matchesSearch && matchesFilter;
      }),
    [filter, query, transactions],
  );

  return (
    <GlassCard>
      <SectionHeader
        title="Recent Transactions"
        subtitle="Transfers, swaps, token mint actions, and NFT-related activity."
        action={<History className="h-4 w-4 text-cyan-300" />}
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs items={transactionFilters} active={filter} onChange={setFilter} />
        <div className="w-full max-w-xs">
          <SearchBar value={query} onChange={setQuery} placeholder="Search transaction or token" />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" />
      ) : filteredTransactions.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="grid grid-cols-[1.2fr_0.7fr_0.55fr_0.75fr_auto] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">
            <div>Transaction</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Time</div>
            <div>Verify</div>
          </div>
          {filteredTransactions.map((transaction) => {
            const explorerUrl = transaction.explorerUrl || (transaction.signature ? buildExplorerUrl(transaction.signature) : undefined);
            const Icon = transactionIcon(transaction.type);

            return (
              <div
                key={transaction._id}
                className="grid grid-cols-[1.2fr_0.7fr_0.55fr_0.75fr_auto] gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                      <Icon className="h-4 w-4 text-cyan-200" />
                    </div>
                    <div className="text-sm font-semibold text-white">{transaction.type}</div>
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-400">
                    {transaction.signature ? shortenAddress(transaction.signature) : transaction.token}
                  </div>
                  {transaction.signature ? (
                    <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      Signature {shortenAddress(transaction.signature)}
                    </div>
                  ) : null}
                  <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    Confidence {formatNumber(transaction.confidenceScore || 0, 0)}%
                  </div>
                </div>
                <div className="text-sm font-medium text-white">
                  {formatNumber(transaction.amount, transaction.token === "BONK" ? 0 : 4)} {transaction.token}
                </div>
                <div>
                  <StatusBadge status={transaction.status} />
                </div>
                <div className="text-sm text-slate-300">{formatDate(transaction.createdAt)}</div>
                <div className="flex justify-end">
                  {explorerUrl ? (
                    <div className="flex gap-2">
                      {transaction.signature ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
                          onClick={async () => {
                            await navigator.clipboard.writeText(transaction.signature!);
                            toast.success("Signature copied");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </button>
                      ) : null}
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
                      >
                        View on Solana Explorer
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-white/10 px-3 py-2 text-xs text-slate-500">
                      Simulated
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No recent transactions" description="Wallet activity will appear here after sends, swaps, mints, or NFT transfers." />
      )}
    </GlassCard>
  );
}
