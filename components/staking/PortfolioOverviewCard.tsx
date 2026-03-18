"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { PortfolioOverview } from "@/types";
import { TOKEN_OPTIONS } from "@/lib/constants";
import { FilterTabs, GlassCard, SectionHeader } from "@/components/shared";
import { TokenRow } from "@/components/dashboard/token-row";
import { formatCurrency, formatNumber } from "@/utils/format";

export function PortfolioOverviewCard({
  portfolio,
  selectedToken,
  onTokenChange,
}: {
  portfolio: PortfolioOverview;
  selectedToken: string;
  onTokenChange: (token: string) => void;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Portfolio Overview"
        subtitle="Shows current holdings, staked amount, fiat value, and chart."
        action={
          <FilterTabs
            items={TOKEN_OPTIONS.map((token) => ({ label: token.label, value: token.value }))}
            active={selectedToken}
            onChange={onTokenChange}
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <TokenRow
          token={portfolio.token}
          label="Selected staking asset"
          value={
            <div className="text-right">
              <div className="font-medium text-white">{formatNumber(portfolio.stakedAmount)} staked</div>
              <div className="text-xs text-slate-500">Reward growth {formatNumber(portfolio.rewardGrowth, 4)}</div>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Staked amount</div>
            <div className="mt-3 text-2xl font-semibold text-white">
              {formatNumber(portfolio.stakedAmount)} {portfolio.token}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Fiat value</div>
            <div className="mt-3 text-2xl font-semibold text-white">{formatCurrency(portfolio.fiatValue)}</div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Reward growth</div>
            <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(portfolio.rewardGrowth, 4)}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={portfolio.chartData}>
            <defs>
              <linearGradient id="stakeGradientCard" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#35D8FF" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#35D8FF" stopOpacity={0} />
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
            <Area type="monotone" dataKey="value" stroke="#35D8FF" fill="url(#stakeGradientCard)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
