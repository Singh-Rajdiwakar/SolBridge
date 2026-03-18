"use client";

import type { MarketOverviewResponse } from "@/types";

import { MiniSparkline } from "@/components/markets/MiniSparkline";
import {
  badgeTone,
  changeTone,
  formatMarketCompactCurrency,
  formatMarketPercent,
} from "@/components/markets/utils";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn } from "@/utils/cn";

function formatStatValue(label: string, value: number | string, currency: string) {
  if (typeof value === "string") {
    return value;
  }
  if (label.toLowerCase().includes("dominance")) {
    return formatMarketPercent(value);
  }
  return formatMarketCompactCurrency(value, currency);
}

export function MarketOverviewCards({
  overview,
  currency,
  loading,
}: {
  overview?: MarketOverviewResponse;
  currency: string;
  loading?: boolean;
}) {
  if (loading) {
    return <LoadingSkeleton type="card" />;
  }

  if (!overview) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {overview.stats.map((stat) => (
        <div
          key={stat.label}
          className="glass-panel group border-white/8 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/18"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{stat.label}</div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {formatStatValue(stat.label, stat.value, currency)}
              </div>
            </div>
            <div className={cn("rounded-md border px-2.5 py-1 text-xs font-semibold", badgeTone(stat.change))}>
              {stat.change >= 0 ? "+" : ""}
              {formatMarketPercent(stat.change)}
            </div>
          </div>
          <div className="mt-4">
            <MiniSparkline data={stat.sparkline} positive={stat.change >= 0} />
          </div>
          <div className={cn("mt-2 text-xs", changeTone(stat.change))}>
            {stat.change >= 0 ? "Momentum expanding" : "Selling pressure elevated"}
          </div>
        </div>
      ))}
    </div>
  );
}
