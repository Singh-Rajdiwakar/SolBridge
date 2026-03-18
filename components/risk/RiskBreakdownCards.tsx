"use client";

import { AlertTriangle, ChartPie, Droplets, Landmark, Waves } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskBreakdownResponse } from "@/types";

const ICON_MAP = {
  volatility: Waves,
  borrow: Landmark,
  liquidity: Droplets,
  concentration: ChartPie,
};

const TONE_MAP = {
  volatility: "text-cyan-300",
  borrow: "text-amber-300",
  liquidity: "text-violet-300",
  concentration: "text-rose-300",
};

export function RiskBreakdownCards({
  data,
  loading,
}: {
  data?: RiskBreakdownResponse;
  loading?: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {data.categories.map((item) => {
        const Icon = ICON_MAP[item.key];
        const tone = TONE_MAP[item.key];

        return (
          <SectionCard
            key={item.key}
            title={item.label}
            description="Weighted contribution to total risk posture."
            action={<Icon className={`h-4 w-4 ${tone}`} />}
            className="p-0"
          >
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-end gap-2">
                <div className="text-4xl font-semibold text-white">{item.score}</div>
                <div className="pb-1 text-sm text-slate-500">/100</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/6">
                <div
                  className={`h-full rounded-full ${item.score <= 35 ? "bg-emerald-400" : item.score <= 65 ? "bg-amber-400" : "bg-rose-400"}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{item.score <= 35 ? "Contained" : item.score <= 65 ? "Monitor" : "Elevated"}</span>
              </div>
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
