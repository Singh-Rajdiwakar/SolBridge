import { ExternalLink, History } from "lucide-react";

import { EmptyState, GlassCard, LoadingSkeleton, SectionHeader, StatusBadge } from "@/components/shared";
import type { TransactionRecord } from "@/types";
import { buildExplorerUrl, shortenAddress } from "@/lib/solana";
import { formatDate, formatNumber } from "@/utils/format";

type WalletTxRow = TransactionRecord & {
  explorerUrl?: string;
};

export function TransactionList({
  transactions,
  loading,
}: {
  transactions: WalletTxRow[];
  loading?: boolean;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Recent Transactions"
        subtitle="Sent SOL, airdrops, receives, and token creation history."
        action={<History className="h-4 w-4 text-cyan-300" />}
      />

      {loading ? (
        <LoadingSkeleton type="list" />
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const explorerUrl = transaction.explorerUrl || (transaction.signature ? buildExplorerUrl(transaction.signature) : undefined);

            return (
              <div
                key={transaction._id}
                className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1.2fr_0.7fr_0.65fr_0.9fr_auto]"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{transaction.type}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {transaction.signature ? shortenAddress(transaction.signature) : transaction.token}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount</div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {formatNumber(transaction.amount, 4)} {transaction.token}
                  </div>
                </div>
                <div className="flex items-start">
                  <StatusBadge status={transaction.status} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Date</div>
                  <div className="mt-2 text-sm text-slate-300">{formatDate(transaction.createdAt)}</div>
                </div>
                <div className="flex items-start justify-end">
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
                    >
                      Explorer
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No recent transactions" description="Wallet activity will appear here after send, receive, airdrop, or mint actions." />
      )}
    </GlassCard>
  );
}
