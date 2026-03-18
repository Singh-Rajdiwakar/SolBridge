import type { ColumnDef } from "@tanstack/react-table";

import type { AdminUserView } from "@/types";
import { DataTable, GlassCard, LoadingSkeleton, RoleBadge, SectionHeader, StatusBadge } from "@/components/shared";
import { formatNumber } from "@/utils/format";

export function AdminUsersTable({
  users,
  loading,
  onViewUser,
}: {
  users: AdminUserView[];
  loading?: boolean;
  onViewUser?: (id: string) => void;
}) {
  const columns: ColumnDef<AdminUserView>[] = [
    {
      header: "User",
      accessorKey: "name",
      cell: ({ row }) => (
        <button type="button" className="text-left" onClick={() => onViewUser?.(row.original._id)}>
          <div className="font-medium text-white">{row.original.name}</div>
          <div className="text-xs text-slate-500">{row.original.email}</div>
        </button>
      ),
    },
    {
      header: "Wallet / Email",
      accessorKey: "walletAddress",
    },
    {
      header: "Total Staked",
      accessorKey: "totalStaked",
      cell: ({ row }) => formatNumber(row.original.totalStaked),
    },
    {
      header: "Reward Earned",
      accessorKey: "rewardEarned",
      cell: ({ row }) => formatNumber(row.original.rewardEarned, 4),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) =>
        row.original.status === "admin" ? <RoleBadge role="admin" /> : <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <GlassCard>
      <SectionHeader title="User Management" subtitle="Quick admin visibility into platform users." />
      {loading ? <LoadingSkeleton type="table" /> : <DataTable columns={columns} data={users} />}
    </GlassCard>
  );
}
