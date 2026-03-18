import { Badge } from "@/components/ui/badge";

export function RoleBadge({ role }: { role: string }) {
  return <Badge variant={role === "admin" ? "default" : "muted"}>{role}</Badge>;
}
