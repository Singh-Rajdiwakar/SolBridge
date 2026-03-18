import type { ReactNode } from "react";

import { StatCard as BaseStatCard } from "@/components/dashboard/stat-card";
import type { StatCardItem } from "@/types";

export function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  chartData,
}: {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
  chartData?: number[];
}) {
  const parsedValue = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
  const parsedChange = change ? Number(change.replace(/[^0-9.-]/g, "")) || 0 : trend === "down" ? -1 : 0;
  const item: StatCardItem = {
    title,
    value: parsedValue,
    change: parsedChange,
    chartData: (chartData || [parsedValue]).map((entry) => ({ value: entry })),
  };

  void icon;
  return <BaseStatCard item={item} />;
}
