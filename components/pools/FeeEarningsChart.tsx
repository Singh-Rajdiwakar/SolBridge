"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { FeeHistoryPoint } from "@/types";
import { FilterTabs, GlassCard, SectionHeader } from "@/components/shared";

export function FeeEarningsChart({
  data,
  range,
  onRangeChange,
}: {
  data: FeeHistoryPoint[];
  range: string;
  onRangeChange: (range: string) => void;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Fee Earnings Chart"
        subtitle="Historical chart of earned trading fees."
        action={
          <FilterTabs
            items={[
              { label: "7D", value: "7d" },
              { label: "30D", value: "30d" },
              { label: "90D", value: "90d" },
            ]}
            active={range}
            onChange={onRangeChange}
          />
        }
      />
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="feeHistoryGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#1AB8FF" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#1AB8FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(8, 12, 28, 0.96)",
                border: "1px solid rgba(53, 216, 255, 0.12)",
                borderRadius: "16px",
              }}
            />
            <Area type="monotone" dataKey="value" stroke="#1AB8FF" fill="url(#feeHistoryGradient)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
