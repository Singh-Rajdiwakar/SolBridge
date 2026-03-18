"use client";

import { Landmark, PiggyBank, TrendingUp, Wallet2 } from "lucide-react";

import { formatCurrency, formatNumber } from "@/utils/format";
import type { TaxSummaryResponse } from "@/types";

const ICONS = [TrendingUp, PiggyBank, Landmark, Wallet2];

export function TaxSummaryCards({ summary }: { summary?: TaxSummaryResponse }) {
  const items = [
    {
      label: "Net Capital Gains",
      value: summary ? formatCurrency(summary.netCapitalGains) : "--",
      helper: summary?.largestGainThisYear ? `Largest gain ${summary.largestGainThisYear.token}` : "No realized gains yet",
      tone: summary && summary.netCapitalGains >= 0 ? "text-emerald-300" : "text-rose-300",
    },
    {
      label: "Staking Income",
      value: summary ? formatCurrency(summary.totalStakingIncome) : "--",
      helper: `${formatNumber(summary?.totalTaxableEvents || 0, 0)} taxable events`,
      tone: "text-cyan-200",
    },
    {
      label: "Lending Income",
      value: summary ? formatCurrency(summary.totalLendingIncome) : "--",
      helper: summary?.largestIncomeSource ? `Largest income ${summary.largestIncomeSource.token}` : "No lending income events",
      tone: "text-cyan-200",
    },
    {
      label: "Combined Taxable Total",
      value: summary ? formatCurrency(summary.combinedTaxableActivityTotal) : "--",
      helper: summary ? `${formatNumber(summary.totalTaxableEvents, 0)} events analyzed` : "Waiting for report generation",
      tone: "text-white",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = ICONS[index];
        return (
          <div key={item.label} className="rounded-xl border border-white/10 bg-[rgba(12,20,39,0.9)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
              <Icon className="h-4 w-4 text-cyan-300" />
            </div>
            <div className={`mt-4 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
            <div className="mt-2 text-sm text-slate-400">{item.helper}</div>
          </div>
        );
      })}
    </div>
  );
}
