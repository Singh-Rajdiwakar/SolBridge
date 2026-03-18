import { ExternalLink } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { SectionCard } from "@/components/dashboard/section-card";
import type { TreasuryEventsResponse } from "@/types";
import { formatCompactCurrency, formatDate } from "@/utils/format";

export function TreasuryEventTimeline({ data }: { data?: TreasuryEventsResponse }) {
  return (
    <SectionCard title="Treasury Event Timeline" description="Proposal, transfer, and admin-linked treasury activity history.">
      {!data?.events?.length ? (
        <EmptyState title="No treasury event history" description="Treasury events appear here after proposal execution, transfers, or reserve updates are indexed." />
      ) : (
        <div className="space-y-4">
          {data.events.map((event) => (
            <div key={event.id} className="flex gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className={`mt-1 h-3 w-3 rounded-full ${event.impact === "high" ? "bg-amber-300" : event.impact === "medium" ? "bg-cyan-300" : "bg-emerald-300"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-white">{event.title}</div>
                  <div className="text-xs text-slate-500">{formatDate(event.createdAt)}</div>
                </div>
                <p className="mt-1 text-sm text-slate-400">{event.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {event.token ? <span>{event.token}</span> : null}
                  {typeof event.amount === "number" && event.amount > 0 ? <span>{formatCompactCurrency(event.amount)}</span> : null}
                  {event.explorerUrl ? (
                    <a href={event.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100">
                      Explorer
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
