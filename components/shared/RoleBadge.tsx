import { RoleBadge as BaseRoleBadge } from "@/components/dashboard/role-badge";

export function RoleBadge({ role }: { role: string }) {
  return <BaseRoleBadge role={role} />;
}
