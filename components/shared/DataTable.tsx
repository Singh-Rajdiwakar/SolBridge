import type { ColumnDef } from "@tanstack/react-table";

import { DataTable as BaseDataTable } from "@/components/dashboard/data-table";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export function DataTable<TData>({
  columns,
  data,
  loading,
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  loading?: boolean;
}) {
  if (loading) {
    return <LoadingSkeleton type="table" />;
  }

  return <BaseDataTable columns={columns} data={data} />;
}
