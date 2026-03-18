"use client";

import { SectionCard } from "@/components/dashboard/section-card";
import type { TaxYearlyReportResponse } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

export function YearlySummaryTable({ report }: { report?: TaxYearlyReportResponse }) {
  return (
    <SectionCard
      title="Yearly Summary"
      description="Month-by-month view of realized gains and protocol income across the current report scope."
    >
      {report?.yearlySummary.monthly.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="pb-3 pr-4">Month</th>
                <th className="pb-3 pr-4">Capital Gains</th>
                <th className="pb-3 pr-4">Staking Income</th>
                <th className="pb-3 pr-4">Lending Income</th>
                <th className="pb-3 pr-4">Taxable Value</th>
                <th className="pb-3">Events</th>
              </tr>
            </thead>
            <tbody>
              {report.yearlySummary.monthly.map((row) => (
                <tr key={row.label} className="border-t border-white/6 text-slate-200">
                  <td className="py-3 pr-4 font-medium text-white">{row.label}</td>
                  <td className={`py-3 pr-4 ${row.capitalGains >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {formatCurrency(row.capitalGains)}
                  </td>
                  <td className="py-3 pr-4 text-cyan-200">{formatCurrency(row.stakingIncome)}</td>
                  <td className="py-3 pr-4 text-cyan-200">{formatCurrency(row.lendingIncome)}</td>
                  <td className="py-3 pr-4 font-semibold text-white">{formatCurrency(row.totalTaxableValue)}</td>
                  <td className="py-3 text-slate-400">{formatNumber(row.taxableEvents, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          No taxable activity was found for this report window.
        </div>
      )}
    </SectionCard>
  );
}
