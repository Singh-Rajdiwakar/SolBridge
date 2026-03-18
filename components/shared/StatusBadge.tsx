import { StatusBadge as BaseStatusBadge } from "@/components/dashboard/status-badge";

export function StatusBadge({ status }: { status: string }) {
  return <BaseStatusBadge status={status} />;
}
