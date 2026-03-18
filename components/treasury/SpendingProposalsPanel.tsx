import { EmptyState } from "@/components/dashboard/empty-state";
import { SectionCard } from "@/components/dashboard/section-card";
import type { TreasuryProposalsResponse } from "@/types";
import { formatCompactCurrency, formatDate, formatPercent } from "@/utils/format";

export function SpendingProposalsPanel({ data }: { data?: TreasuryProposalsResponse }) {
  return (
    <SectionCard title="Spending Proposals" description="Treasury-linked governance proposals and their projected funding impact.">
      {!data?.proposals?.length ? (
        <EmptyState title="No treasury proposals detected" description="Treasury spending and allocation proposals will appear here when governance metadata flags them." />
      ) : (
        <div className="space-y-4">
          {data.proposals.map((proposal) => (
            <div key={proposal.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold text-white">{proposal.title}</div>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      {proposal.treasuryImpact}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{proposal.summary}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Requested</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {proposal.requestedAmount > 0 ? formatCompactCurrency(proposal.requestedAmount) : "Proposal-linked"}
                  </div>
                  <div className="text-xs text-slate-500">{proposal.requestedToken}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {[
                  ["Category", proposal.category],
                  ["Target", proposal.targetAllocation],
                  ["Quorum progress", formatPercent(proposal.quorumProgress)],
                  ["Deadline", formatDate(proposal.deadline)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
                    <div className="mt-2 text-sm font-medium text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
