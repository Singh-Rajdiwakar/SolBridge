import type { ReactNode } from "react";
import { SectionCard } from "@/components/dashboard/section-card";

export function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <SectionCard title={title} description={description}>
      <div className="h-72">{children}</div>
    </SectionCard>
  );
}
