"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import type { RiskTrendResponse } from "@/types";

export function RiskTrendChart({ data }: { data?: RiskTrendResponse }) {
  return (
    <SectionCard
      title="Risk Trend"
      description="Historical movement of total portfolio risk and the four core risk components."
    >
      {data?.series?.length ? (
        <div className="space-y-4">
          <div className="text-sm text-slate-400">{data.whatChangedThisWeek}</div>
          <div className="h-[320px] rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(5, 8, 22, 0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.8rem",
                    color: "#e2e8f0",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="totalRiskScore" stroke="#38bdf8" strokeWidth={3} dot={false} name="Total" />
                <Line type="monotone" dataKey="volatilityRisk" stroke="#14b8a6" strokeWidth={1.7} dot={false} name="Volatility" />
                <Line type="monotone" dataKey="borrowRisk" stroke="#f59e0b" strokeWidth={1.7} dot={false} name="Borrow" />
                <Line type="monotone" dataKey="liquidityRisk" stroke="#8b5cf6" strokeWidth={1.7} dot={false} name="Liquidity" />
                <Line type="monotone" dataKey="concentrationRisk" stroke="#fb7185" strokeWidth={1.7} dot={false} name="Concentration" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {data.eventMarkers.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.eventMarkers.map((event) => (
                <div key={event.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{event.severity}</div>
                  <div className="mt-2 text-sm font-medium text-white">{event.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Risk trend will populate after portfolio snapshots accumulate.
        </div>
      )}
    </SectionCard>
  );
}
