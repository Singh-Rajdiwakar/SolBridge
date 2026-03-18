"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable, StatusBadge } from "@/components/shared";
import { formatDate, formatNumber } from "@/utils/format";

type ActivityRow = {
  _id?: string;
  id?: string;
  type: string;
  token: string;
  amount: number;
  status: string;
  createdAt: string;
};

export function LendingActivityTable({
  activities,
  loading,
}: {
  activities: ActivityRow[];
  loading?: boolean;
}) {
  const columns: ColumnDef<ActivityRow>[] = [
    {
      header: "Activity",
      accessorKey: "type",
      cell: ({ row }) => <span className="capitalize text-white">{row.original.type}</span>,
    },
    {
      header: "Token",
      accessorKey: "token",
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => formatNumber(row.original.amount),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ];

  return <DataTable columns={columns} data={activities} loading={loading} />;
}
