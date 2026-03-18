"use client";

import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/dashboard/empty-state";
import { SectionCard } from "@/components/dashboard/section-card";
import type { TreasuryGrowthResponse } from "@/types";
import { formatCompactCurrency } from "@/utils/format";

export function TreasuryGrowthChart({ data }: { data?: TreasuryGrowthResponse }) {
  return (
    <SectionCard title="Treasury Growth Chart" description="Treasury value over time with governance-impact markers.">
      {!data?.series?.length ? (
        <EmptyState title="No treasury history yet" description="Treasury snapshots will populate after reserve balances begin syncing." />
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series}>
              <defs>
                <linearGradient id="treasuryGrowthFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#35D8FF" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#35D8FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCompactCurrency(value)} />
              <Tooltip
                formatter={(value: number) => formatCompactCurrency(value)}
                contentStyle={{
                  background: "rgba(8, 12, 28, 0.96)",
                  border: "1px solid rgba(53, 216, 255, 0.12)",
                  borderRadius: "16px",
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#35D8FF" fill="url(#treasuryGrowthFill)" strokeWidth={2.5} />
              {data.eventMarkers.slice(0, 3).map((marker, index) => {
                const target = data.series[Math.max(0, data.series.length - 1 - index)];
                if (!target) return null;
                return (
                  <ReferenceDot
                    key={marker.id}
                    x={target.label}
                    y={target.value}
                    r={4}
                    fill={marker.impact.includes("high") ? "#F59E0B" : "#22D3EE"}
                    stroke="rgba(255,255,255,0.35)"
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
