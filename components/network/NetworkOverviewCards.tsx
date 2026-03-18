"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowDownRight, ArrowUpRight, Clock3, DatabaseZap, RadioTower, Waves, Wifi } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

import { GlassCard, SectionHeader } from "@/components/shared";
import type { NetworkOverviewCard as NetworkOverviewCardItem } from "@/types";
import { formatNumber, formatRelativeTime } from "@/utils/format";

const ICONS = {
  tps: Activity,
  blockTime: Clock3,
  throughput: DatabaseZap,
  avgFee: Waves,
  validatorCount: RadioTower,
  rpcLatency: Wifi,
};

export function NetworkOverviewCards({ cards }: { cards: NetworkOverviewCardItem[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <GlassCard>
      <SectionHeader
        title="Network Overview"
        subtitle="Core Solana performance indicators and recent trend direction for the active RPC path."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => {
          const Icon = ICONS[card.key as keyof typeof ICONS] || Activity;
          const trendPositive =
            card.key === "blockTime" || card.key === "avgFee" || card.key === "rpcLatency"
              ? card.trend <= 0
              : card.trend >= 0;
          const TrendIcon = trendPositive ? ArrowUpRight : ArrowDownRight;

          return (
            <motion.div
              key={card.key}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{card.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{formatCardValue(card.value, card.unit)}</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.05] p-2">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <div className={`inline-flex items-center gap-1 ${trendPositive ? "text-emerald-300" : "text-rose-300"}`}>
                  <TrendIcon className="h-4 w-4" />
                  {formatNumber(Math.abs(card.trend), card.unit === "SOL" ? 6 : 2)}
                </div>
                <div className="text-slate-500">Updated {formatRelativeTime(card.lastUpdated)}</div>
              </div>
              <div className="mt-4 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={card.sparkline.map((value, sparkIndex) => ({ label: sparkIndex, value }))}>
                    <Tooltip content={<SparkTooltip unit={card.unit} />} />
                    <Line
                      dataKey="value"
                      dot={false}
                      stroke={trendPositive ? "#22d3ee" : "#f59e0b"}
                      strokeWidth={2}
                      animationDuration={reduceMotion ? 0 : 500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function SparkTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  unit: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return <div className="rounded-md border border-white/10 bg-slate-950/92 px-2 py-1 text-xs text-white">{formatCardValue(Number(payload[0]?.value || 0), unit)}</div>;
}

function formatCardValue(value: number, unit: string) {
  if (unit === "SOL") return `${formatNumber(value, 6)} ${unit}`;
  if (unit === "ms") return `${formatNumber(value, 0)} ${unit}`;
  if (unit === "s") return `${formatNumber(value, 3)} ${unit}`;
  if (unit) return `${formatNumber(value, unit === "TPS" ? 0 : 2)} ${unit}`;
  return formatNumber(value, 0);
}
