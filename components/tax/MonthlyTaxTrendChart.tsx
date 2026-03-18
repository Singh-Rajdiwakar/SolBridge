"use client";

import {
  Bar,
  BarChart,
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
import type { TaxYearlyReportResponse } from "@/types";

const tooltipStyle = {
  background: "rgba(8, 12, 28, 0.96)",
  border: "1px solid rgba(53, 216, 255, 0.12)",
  borderRadius: "16px",
};

export function MonthlyTaxTrendChart({ report }: { report?: TaxYearlyReportResponse }) {
  return (
    <SectionCard
      title="Monthly Tax Trend"
      description="Capital gains, staking income, lending income, and total taxable value across the report year."
    >
      {report?.monthlyTrend.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.monthlyTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="capitalGains" fill="#22C55E" radius={[8, 8, 0, 0]} />
                <Bar dataKey="stakingIncome" fill="#22D3EE" radius={[8, 8, 0, 0]} />
                <Bar dataKey="lendingIncome" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.monthlyTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="totalTaxableValue" stroke="#22D3EE" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Monthly trend charts will populate when taxable events and price history are available.
        </div>
      )}
    </SectionCard>
  );
}
