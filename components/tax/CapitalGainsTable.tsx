"use client";

import { SectionCard } from "@/components/dashboard/section-card";
import type { TaxCapitalGainsResponse } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

export function CapitalGainsTable({ data }: { data?: TaxCapitalGainsResponse }) {
  return (
    <SectionCard
      title="Capital Gains Report"
      description="Average-cost basis disposal summary across wallet and protocol movement events."
    >
      {data?.rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="pb-3 pr-4">Token</th>
                <th className="pb-3 pr-4">Acquired</th>
                <th className="pb-3 pr-4">Disposed</th>
                <th className="pb-3 pr-4">Avg Cost</th>
                <th className="pb-3 pr-4">Disposal Value</th>
                <th className="pb-3 pr-4">Gain/Loss</th>
                <th className="pb-3">Holding</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.token} className="border-t border-white/6 text-slate-200">
                  <td className="py-3 pr-4 font-medium text-white">{row.token}</td>
                  <td className="py-3 pr-4">{formatNumber(row.acquiredAmount, 4)}</td>
                  <td className="py-3 pr-4">{formatNumber(row.disposedAmount, 4)}</td>
                  <td className="py-3 pr-4">{formatCurrency(row.averageAcquisitionCost)}</td>
                  <td className="py-3 pr-4">{formatCurrency(row.disposalValue)}</td>
                  <td className={`py-3 pr-4 font-semibold ${row.capitalGainLoss >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {formatCurrency(row.capitalGainLoss)}
                  </td>
                  <td className="py-3 text-slate-400">{row.holdingPeriodLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          No taxable disposal events found for the current filters.
        </div>
      )}
    </SectionCard>
  );
}
