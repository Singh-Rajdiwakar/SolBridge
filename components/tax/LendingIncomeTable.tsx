"use client";

import { SectionCard } from "@/components/dashboard/section-card";
import type { TaxLendingIncomeResponse } from "@/types";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

export function LendingIncomeTable({ data }: { data?: TaxLendingIncomeResponse }) {
  return (
    <SectionCard
      title="Lending Income"
      description="Interest, incentives, and yield reward events recognized from lending-related protocol activity."
    >
      {data?.events.length ? (
        <div className="space-y-3">
          {data.events.map((event) => (
            <div key={event.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{event.token}</div>
                  <div className="mt-1 text-sm text-slate-400">{formatDate(event.eventDate)}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-cyan-200">{formatCurrency(event.usdValue)}</div>
                  <div className="text-sm text-slate-400">{formatNumber(event.amount, 6)} {event.token}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          No lending income events were detected. Supply APR estimates remain available elsewhere in analytics.
        </div>
      )}
    </SectionCard>
  );
}
