"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GlassCard, SectionHeader } from "@/components/shared";
import { formatNumber } from "@/utils/format";

type Point = {
  label: string;
  recordedAt: string;
  value: number;
};

export function MetricChartCard({
  title,
  subtitle,
  data,
  color,
  unit,
  current,
  average,
  peak,
  low,
  status,
  variant = "line",
  trailingMetric,
}: {
  title: string;
  subtitle: string;
  data: Point[];
  color: string;
  unit: string;
  current: number;
  average: number;
  peak: number;
  low: number;
  status?: string;
  variant?: "line" | "bar";
  trailingMetric?: { label: string; value: string };
}) {
  const reduceMotion = useReducedMotion();
  const gradientId = `network-gradient-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(10px)" }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard>
        <SectionHeader
          title={title}
          subtitle={subtitle}
          action={
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-400">
              {status || "live"}
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Current" value={formatMetric(current, unit)} />
          <Metric label="Average" value={formatMetric(average, unit)} />
          <Metric label="Peak" value={formatMetric(peak, unit)} />
          <Metric label={trailingMetric?.label || "Low"} value={trailingMetric?.value || formatMetric(low, unit)} />
        </div>

        <div className="mt-5 h-72 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          {data.length ? (
            <ResponsiveContainer width="100%" height="100%">
              {variant === "bar" ? (
                <BarChart data={data}>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#7f8baa", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7f8baa", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "rgba(34,211,238,0.06)" }} />
                  <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#7f8baa", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7f8baa", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "rgba(34,211,238,0.26)" }} />
                  <Area
                    dataKey="value"
                    stroke={color}
                    fill={`url(#${gradientId})`}
                    strokeWidth={2.1}
                    animationDuration={reduceMotion ? 0 : 650}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-sm text-slate-400">
              Network history will populate as snapshots accumulate.
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/92 px-3 py-2 shadow-[0_18px_60px_rgba(3,8,20,0.45)]">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{formatMetric(Number(payload[0]?.value || 0), unit)}</div>
    </div>
  );
}

function formatMetric(value: number, unit: string) {
  if (unit === "SOL") return `${formatNumber(value, 6)} ${unit}`;
  if (unit === "s") return `${formatNumber(value, 3)} ${unit}`;
  if (unit === "ms") return `${formatNumber(value, 0)} ${unit}`;
  if (unit) return `${formatNumber(value, unit === "TPS" ? 0 : 2)} ${unit}`;
  return formatNumber(value, 0);
}
