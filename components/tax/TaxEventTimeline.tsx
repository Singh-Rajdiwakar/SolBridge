"use client";

import { Clock3 } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { TaxYearlyReportResponse } from "@/types";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

export function TaxEventTimeline({ report }: { report?: TaxYearlyReportResponse }) {
  return (
    <SectionCard
      title="Taxable Event Timeline"
      description="Timeline of disposal, staking reward, and lending income events that contributed to this report."
      action={<Clock3 className="h-4 w-4 text-cyan-300" />}
    >
      {report?.eventTimeline.length ? (
        <div className="space-y-3">
          {report.eventTimeline.map((event) => (
            <div key={event.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{event.label}</div>
                  <div className="mt-1 text-sm text-slate-400">{formatDate(event.eventDate)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-base font-semibold ${event.gainLoss !== undefined && event.gainLoss < 0 ? "text-rose-300" : "text-emerald-300"}`}>
                    {event.gainLoss !== undefined ? formatCurrency(event.gainLoss) : formatCurrency(event.usdValue)}
                  </div>
                  <div className="text-sm text-slate-400">{formatNumber(event.amount, 6)} {event.token}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          No tax-relevant events were detected for the selected report scope.
        </div>
      )}
    </SectionCard>
  );
}
