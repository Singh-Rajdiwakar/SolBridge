import { StatusBadge } from "@/components/shared";
import type { Proposal } from "@/types";
import { formatDate, formatPercent } from "@/utils/format";

export function ProposalCard({
  proposal,
  active,
  onClick,
}: {
  proposal: Proposal;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
        active
          ? "border-cyan-300/30 bg-cyan-400/10 shadow-neon"
          : "border-white/10 bg-white/[0.03] hover:border-cyan-300/20 hover:bg-white/[0.05]"
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="font-medium text-white">{proposal.title}</div>
          <div className="mt-1 text-sm text-slate-400">
            {proposal.category} by {proposal.proposerId?.name || "Unknown"}
          </div>
          <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
            {formatDate(proposal.startDate)} to {formatDate(proposal.endDate)}
          </div>
        </div>
        <div className="space-y-2 text-right">
          <StatusBadge status={proposal.status} />
          <div className="text-xs text-slate-500">{formatPercent(proposal.participation)} participation</div>
        </div>
      </div>
    </button>
  );
}
