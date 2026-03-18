import { StatCard } from "@/components/shared/StatCard";

type MetricItem = {
  title: string;
  value: string | number;
  change?: string;
  chartData?: number[];
};

export function MetricStrip({ items }: { items: MetricItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={item.value}
          change={item.change}
          chartData={item.chartData}
        />
      ))}
    </div>
  );
}
