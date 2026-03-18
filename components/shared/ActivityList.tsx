import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/EmptyState";

export function ActivityList({
  items,
  renderItem,
  emptyTitle = "No activity",
  emptyDescription = "Activity will appear here when records become available.",
}: {
  items: unknown[];
  renderItem: (item: unknown, index: number) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return <div className="space-y-3">{items.map(renderItem)}</div>;
}
