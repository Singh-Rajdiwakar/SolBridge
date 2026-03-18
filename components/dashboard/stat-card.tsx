"use client";

import { ArrowUpRight } from "lucide-react";

import type { StatCardItem } from "@/types";
import { formatNumber } from "@/utils/format";
import { SparklineChart } from "@/components/charts/sparkline-chart";

export function StatCard({ item }: { item: StatCardItem }) {
  const positive = item.change >= 0;
  return (
    <div className="glass-panel-strong relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(242,201,76,0.62),transparent)]" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#8e877b]">{item.title}</p>
          <div className="metric-value mt-2">
            {item.prefix}
            {formatNumber(item.value)}
            {item.suffix}
          </div>
        </div>
        <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${positive ? "border-[rgba(242,201,76,0.22)] bg-[rgba(242,201,76,0.1)] text-[#f3d57c]" : "border-rose-400/20 bg-rose-500/10 text-rose-200"}`}>
          <ArrowUpRight className="h-3.5 w-3.5" />
          {item.change.toFixed(1)}%
        </div>
      </div>
      <SparklineChart data={item.chartData} />
    </div>
  );
}
