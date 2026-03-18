import { History } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { TransactionRecord } from "@/types";
import { DataTable, EmptyState, GlassCard, LoadingSkeleton, SectionHeader, StatusBadge } from "@/components/shared";
import { formatDate, formatNumber } from "@/utils/format";

export function TransactionHistoryCard({
  transactions,
  loading,
}: {
  transactions: TransactionRecord[];
  loading?: boolean;
}) {
  const columns: ColumnDef<TransactionRecord>[] = [
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/10 p-2">
            <History className="h-4 w-4 text-cyan-300" />
          </div>
          <div>
            <div className="font-medium text-white">{row.original.type}</div>
            <div className="text-xs text-slate-500">{row.original.token}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => <span className="font-medium text-white">{formatNumber(row.original.amount)}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "Timestamp",
      accessorKey: "createdAt",
      cell: ({ row }) => <span className="text-slate-400">{formatDate(row.original.createdAt)}</span>,
    },
  ];

  return (
    <GlassCard>
      <SectionHeader title="Transaction History" subtitle="Shows staking-related activity log." />
      {loading ? (
        <LoadingSkeleton type="table" />
      ) : transactions.length > 0 ? (
        <DataTable columns={columns} data={transactions} />
      ) : (
        <EmptyState title="No staking history yet" description="Start a new position to populate your staking activity feed." />
      )}
    </GlassCard>
  );
}
