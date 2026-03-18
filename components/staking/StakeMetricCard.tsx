import { StatCard } from "@/components/shared/StatCard";

export function StakeMetricCard({
  label,
  value,
  delta,
  sparkline,
}: {
  label: string;
  value: string;
  delta: string;
  sparkline: number[];
}) {
  return <StatCard title={label} value={value} change={delta} chartData={sparkline} />;
}
