"use client";

import { useMemo } from "react";
import { GitCompareArrows } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MarketChartResponse, MarketCoin } from "@/types";
import { CoinSelector } from "@/components/markets/CoinSelector";
import { formatMarketPercent } from "@/components/markets/utils";
import { Button } from "@/components/ui/button";

const SERIES_COLORS = ["#3B82F6", "#22D3EE", "#34D399"];

export function CompareCoinsPanel({
  coins,
  selectedIds,
  charts,
  onChange,
}: {
  coins: MarketCoin[];
  selectedIds: string[];
  charts: Record<string, MarketChartResponse | undefined>;
  onChange: (coinIds: string[]) => void;
}) {
  const series = useMemo(() => {
    const basePoints = charts[selectedIds[0]]?.points || [];
    return basePoints.map((point, index) => {
      const row: Record<string, number | string> = {
        label: new Date(point.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };

      selectedIds.forEach((coinId) => {
        const points = charts[coinId]?.points || [];
        const base = points[0]?.price || 1;
        const current = points[index]?.price || base;
        row[coinId] = ((current / base) - 1) * 100;
      });

      return row;
    });
  }, [charts, selectedIds]);

  return (
    <div className="glass-panel space-y-5 border-white/8 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Market Comparison</div>
          <div className="mt-2 text-xl font-semibold text-white">Normalized performance spread</div>
        </div>
        <div className="rounded-md border border-cyan-400/14 bg-cyan-500/10 p-2 text-cyan-300">
          <GitCompareArrows className="h-4 w-4" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <CoinSelector
            key={index}
            coins={coins}
            value={selectedIds[index] || coins[0]?.id || "bitcoin"}
            onChange={(coinId) => {
              const next = [...selectedIds];
              next[index] = coinId;
              onChange(next.filter(Boolean));
            }}
          />
        ))}
      </div>

      <div className="h-[18rem]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#6E7FA3", fontSize: 11 }} minTickGap={32} />
            <YAxis tick={{ fill: "#6E7FA3", fontSize: 11 }} tickFormatter={(value) => formatMarketPercent(Number(value))} width={76} />
            <Tooltip
              contentStyle={{
                background: "rgba(10,16,32,0.95)",
                border: "1px solid rgba(120,170,255,0.14)",
                borderRadius: 10,
              }}
              formatter={(value: number) => formatMarketPercent(Number(value))}
            />
            {selectedIds.map((coinId, index) => (
              <Line
                key={coinId}
                type="monotone"
                dataKey={coinId}
                stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3">
        {selectedIds.map((coinId, index) => {
          const coin = coins.find((item) => item.id === coinId);
          return (
            <div key={coinId} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }} />
              {coin?.name || coinId}
            </div>
          );
        })}
      </div>

      <Button variant="secondary" className="w-full" onClick={() => onChange(selectedIds.slice(0, 2))}>
        Reset to two-coin compare
      </Button>
    </div>
  );
}
