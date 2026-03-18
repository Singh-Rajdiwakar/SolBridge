import type { ReactNode } from "react";

import { EmptyState as BaseEmptyState } from "@/components/dashboard/empty-state";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <BaseEmptyState title={title} description={description || ""} />
      {action ? <div className="flex justify-center">{action}</div> : null}
    </div>
  );
}
