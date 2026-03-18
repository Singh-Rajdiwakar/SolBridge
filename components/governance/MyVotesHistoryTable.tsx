"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable, StatusBadge } from "@/components/shared";
import type { MyVoteHistory } from "@/types";
import { formatDate, formatNumber } from "@/utils/format";

export function MyVotesHistoryTable({
  votes,
  loading,
}: {
  votes: MyVoteHistory[];
  loading?: boolean;
}) {
  const columns: ColumnDef<MyVoteHistory>[] = [
    {
      header: "Proposal",
      cell: ({ row }) => row.original.proposalId.title,
    },
    {
      header: "Your Vote",
      accessorKey: "voteType",
      cell: ({ row }) => <span className="capitalize">{row.original.voteType}</span>,
    },
    {
      header: "Result",
      cell: ({ row }) => <StatusBadge status={row.original.proposalId.status} />,
    },
    {
      header: "Reward",
      accessorKey: "reward",
      cell: ({ row }) => formatNumber(row.original.reward),
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ];

  return <DataTable columns={columns} data={votes} loading={loading} />;
}
