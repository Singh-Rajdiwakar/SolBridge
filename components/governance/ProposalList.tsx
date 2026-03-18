import type { ReactNode } from "react";

import { EmptyState, GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import type { Proposal } from "@/types";
import { ProposalCard } from "@/components/governance/ProposalCard";

export function ProposalList({
  proposals,
  loading,
  onSelectProposal,
  activeProposalId,
  action,
}: {
  proposals: Proposal[];
  loading?: boolean;
  onSelectProposal: (proposal: Proposal) => void;
  activeProposalId?: string;
  action?: ReactNode;
}) {
  return (
    <GlassCard>
      <SectionHeader title="Proposal List" subtitle="Displays active and historical governance proposals." action={action} />

      {loading ? (
        <LoadingSkeleton type="list" />
      ) : proposals.length > 0 ? (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal._id}
              proposal={proposal}
              active={proposal._id === activeProposalId}
              onClick={() => onSelectProposal(proposal)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No proposals found" description="Adjust your filter or publish a proposal to populate governance activity." />
      )}
    </GlassCard>
  );
}
