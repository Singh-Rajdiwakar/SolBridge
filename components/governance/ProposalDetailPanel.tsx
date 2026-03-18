import { EmptyState, GlassCard, SectionHeader, StatusBadge } from "@/components/shared";
import type { Proposal, ProposalVoteStats } from "@/types";
import { formatDate } from "@/utils/format";
import { VoteActionButtons } from "@/components/governance/VoteActionButtons";
import { VotingProgressBar } from "@/components/governance/VotingProgressBar";

export function ProposalDetailPanel({
  proposal,
  voteStats,
  onVote,
  loading,
}: {
  proposal: Proposal | null;
  voteStats?: ProposalVoteStats;
  onVote: (voteType: "yes" | "no" | "abstain") => void;
  loading?: boolean;
}) {
  if (!proposal) {
    return (
      <GlassCard>
        <SectionHeader title="Active Proposal Detail" subtitle="Select a proposal to inspect full voting details." />
        <EmptyState title="No proposal selected" description="Pick a proposal from the list to view the summary, quorum, and voting controls." />
      </GlassCard>
    );
  }

  const totals = voteStats || {
    yes: proposal.votesYes,
    no: proposal.votesNo,
    abstain: proposal.votesAbstain,
    quorum: proposal.quorum,
    totalVotes: proposal.votesYes + proposal.votesNo + proposal.votesAbstain,
  };

  return (
    <GlassCard>
      <SectionHeader
        title="Active Proposal Detail"
        subtitle="Detailed proposal info with live vote controls and quorum tracking."
        action={<StatusBadge status={proposal.status} />}
      />

      <div className="space-y-5">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-slate-400">{proposal.category}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{proposal.title}</div>
          <p className="mt-4 text-sm leading-7 text-slate-300">{proposal.description}</p>
          <div className="mt-4 text-sm text-slate-500">Voting ends {formatDate(proposal.endDate)}</div>
        </div>

        <VotingProgressBar
          yes={totals.yes}
          no={totals.no}
          abstain={totals.abstain}
          quorum={totals.quorum}
          totalVotes={totals.totalVotes}
        />

        <VoteActionButtons
          disabled={loading || proposal.status !== "active"}
          onYes={() => onVote("yes")}
          onNo={() => onVote("no")}
          onAbstain={() => onVote("abstain")}
        />
      </div>
    </GlassCard>
  );
}
