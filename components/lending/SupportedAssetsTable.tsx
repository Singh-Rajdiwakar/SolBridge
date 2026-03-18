"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable, StatusBadge, TokenBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { LendingMarket } from "@/types";
import { formatNumber, formatPercent } from "@/utils/format";

export function SupportedAssetsTable({
  assets,
  loading,
  onSupply,
  onBorrow,
  onWithdraw,
  onRepay,
}: {
  assets: LendingMarket[];
  loading?: boolean;
  onSupply: (asset: LendingMarket) => void;
  onBorrow: (asset: LendingMarket) => void;
  onWithdraw: (asset: LendingMarket) => void;
  onRepay: (asset: LendingMarket) => void;
}) {
  const columns: ColumnDef<LendingMarket>[] = [
    {
      header: "Asset",
      cell: ({ row }) => (
        <div className="space-y-2">
          <TokenBadge symbol={row.original.token} />
          <div className="text-xs text-slate-500">Wallet balance {formatNumber(row.original.walletBalance)}</div>
        </div>
      ),
    },
    {
      header: "Supply APR",
      accessorKey: "supplyApr",
      cell: ({ row }) => formatPercent(row.original.supplyApr),
    },
    {
      header: "Borrow APR",
      accessorKey: "borrowApr",
      cell: ({ row }) => formatPercent(row.original.borrowApr),
    },
    {
      header: "Utilization",
      accessorKey: "utilization",
      cell: ({ row }) => (
        <div className="space-y-2">
          <div>{formatPercent(row.original.utilization)}</div>
          <StatusBadge status={row.original.utilization > 85 ? "risky" : "active"} />
        </div>
      ),
    },
    {
      header: "Collateral Factor",
      accessorKey: "collateralFactor",
      cell: ({ row }) => formatPercent(row.original.collateralFactor),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onSupply(row.original)}>
            Supply
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onWithdraw(row.original)}>
            Withdraw
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onBorrow(row.original)}>
            Borrow
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onRepay(row.original)}>
            Repay
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={assets} loading={loading} />;
}
