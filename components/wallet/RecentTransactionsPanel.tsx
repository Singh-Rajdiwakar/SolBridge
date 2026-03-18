"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  Coins,
  Copy,
  ExternalLink,
  History,
  ImageIcon,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { FilterTabs, GlassCard, LoadingSkeleton, SearchBar, SectionHeader, StatusBadge } from "@/components/shared";
import { EmptyStateBlock } from "@/components/wallet/EmptyStateBlock";
import type { TransactionRecord } from "@/types";
import { buildExplorerUrl, shortenAddress } from "@/lib/solana";
import { formatDate, formatNumber, formatRelativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";

const transactionFilters = [
  { label: "All", value: "all" },
  { label: "Sent", value: "sent" },
  { label: "Received", value: "received" },
  { label: "Swaps", value: "swap" },
  { label: "Token", value: "mint" },
  { label: "NFT", value: "nft" },
];

function transactionIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("received") || normalized.includes("airdrop")) {
    return ArrowDownLeft;
  }
  if (normalized.includes("swap")) {
    return ArrowUpDown;
  }
  if (normalized.includes("token") || normalized.includes("mint")) {
    return Coins;
  }
  if (normalized.includes("nft")) {
    return ImageIcon;
  }
  return ArrowUpRight;
}

function matchesFilter(filter: string, transaction: TransactionRecord) {
  const type = transaction.type.toLowerCase();
  if (filter === "all") {
    return true;
  }
  if (filter === "sent") {
    return type.includes("sent");
  }
  if (filter === "received") {
    return type.includes("received") || type.includes("airdrop");
  }
  if (filter === "swap") {
    return type.includes("swap");
  }
  if (filter === "mint") {
    return type.includes("token") || type.includes("mint");
  }
  if (filter === "nft") {
    return type.includes("nft");
  }
  return true;
}

export function RecentTransactionsPanel({
  transactions,
  loading,
}: {
  transactions: TransactionRecord[];
  loading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredTransactions = useMemo(() => {
    const search = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesSearch =
        !search ||
        transaction.type.toLowerCase().includes(search) ||
        transaction.token.toLowerCase().includes(search) ||
        transaction.signature?.toLowerCase().includes(search) ||
        transaction.receiver?.toLowerCase().includes(search);

      return matchesSearch && matchesFilter(filter, transaction);
    });
  }, [filter, query, transactions]);

  return (
    <GlassCard className="h-full">
      <SectionHeader
        title="Recent Transactions"
        subtitle="Transfers, swaps, token events, and NFT activity with explorer verification and live status context."
        action={<History className="h-4 w-4 text-cyan-300" />}
      />

      <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
        <FilterTabs items={transactionFilters} active={filter} onChange={setFilter} />
        <div className="w-full xl:max-w-sm">
          <SearchBar value={query} onChange={setQuery} placeholder="Search signature, token, or type" />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" />
      ) : filteredTransactions.length === 0 ? (
        <EmptyStateBlock
          title="No recent transactions yet"
          description="Once activity happens, transfers, swaps, and token events will appear here with explorer verification and execution history."
          icon={<Search className="h-5 w-5" />}
        />
      ) : (
        <>
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))]">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.7fr_auto] gap-3 border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                <div>Transaction</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Time</div>
                <div>Explorer</div>
              </div>
              {filteredTransactions.map((transaction, index) => (
                <TransactionRow key={transaction._id} transaction={transaction} compact={false} index={index} />
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filteredTransactions.map((transaction, index) => (
              <TransactionRow key={transaction._id} transaction={transaction} compact index={index} />
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}

function TransactionRow({
  transaction,
  compact,
  index,
}: {
  transaction: TransactionRecord;
  compact: boolean;
  index: number;
}) {
  const explorerUrl = transaction.explorerUrl || (transaction.signature ? buildExplorerUrl(transaction.signature) : undefined);
  const Icon = transactionIcon(transaction.type);
  const amountTone =
    transaction.type.toLowerCase().includes("received") || transaction.type.toLowerCase().includes("airdrop")
      ? "text-emerald-300"
      : transaction.type.toLowerCase().includes("swap")
        ? "text-cyan-200"
        : "text-slate-100";

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        whileHover={{ y: -2 }}
        className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0b1324]/90">
                <Icon className="h-4 w-4 text-cyan-200" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{transaction.type}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {transaction.signature ? shortenAddress(transaction.signature) : transaction.token}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Amount</div>
                <div className={cn("mt-1 font-semibold", amountTone)}>
                  {formatNumber(transaction.amount, transaction.token === "BONK" ? 0 : 4)} {transaction.token}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Time</div>
                <div className="mt-1 text-slate-300">{formatRelativeTime(transaction.createdAt)}</div>
              </div>
            </div>
          </div>
          <StatusBadge status={transaction.status} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TypeChip label={transaction.type} />
          <TypeChip label={`${formatNumber(transaction.confidenceScore || 0, 0)}% confidence`} subtle />
        </div>
        <ActionRow explorerUrl={explorerUrl} signature={transaction.signature} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.02 }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.7fr_auto] gap-3 border-b border-white/10 px-4 py-4 last:border-b-0"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0b1324]/90">
            <Icon className="h-4 w-4 text-cyan-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="truncate text-sm font-semibold text-white">{transaction.type}</div>
              <TypeChip label={transaction.type} />
            </div>
            <div className="mt-1 text-sm text-slate-400">
              {transaction.signature ? shortenAddress(transaction.signature) : transaction.token}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
              <span>{transaction.signature ? `Sig ${shortenAddress(transaction.signature)}` : "Simulated"}</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>{formatNumber(transaction.confidenceScore || 0, 0)}% confidence</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("self-center text-sm font-semibold", amountTone)}>
        {formatNumber(transaction.amount, transaction.token === "BONK" ? 0 : 4)} {transaction.token}
      </div>
      <div className="self-center">
        <StatusBadge status={transaction.status} />
      </div>
      <div className="self-center text-sm text-slate-300">
        <div>{formatRelativeTime(transaction.createdAt)}</div>
        <div className="mt-1 text-xs text-slate-500">{formatDate(transaction.createdAt)}</div>
      </div>
      <div className="self-center">
        <ActionRow explorerUrl={explorerUrl} signature={transaction.signature} />
      </div>
    </motion.div>
  );
}

function ActionRow({
  explorerUrl,
  signature,
}: {
  explorerUrl?: string;
  signature?: string;
}) {
  if (!explorerUrl) {
    return (
      <div className="mt-4 flex justify-end">
        <span className="inline-flex rounded-md border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-500">
          Mirrored
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap justify-end gap-2">
      {signature ? (
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-xs text-slate-300 transition hover:border-cyan-300/28 hover:text-white"
          onClick={async () => {
            await navigator.clipboard.writeText(signature);
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
        className="inline-flex h-9 items-center gap-2 rounded-md border border-cyan-400/18 bg-cyan-400/8 px-3 text-xs text-cyan-100 transition hover:border-cyan-300/34 hover:bg-cyan-400/12"
      >
        View
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function TypeChip({ label, subtle = false }: { label: string; subtle?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
        subtle
          ? "border-white/10 bg-white/[0.03] text-slate-400"
          : "border-cyan-400/18 bg-cyan-400/8 text-cyan-100",
      )}
    >
      {label}
    </span>
  );
}
