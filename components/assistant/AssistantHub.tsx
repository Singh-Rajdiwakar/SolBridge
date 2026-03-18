"use client";

import { toast } from "sonner";

import { AssistantActionLinks } from "@/components/assistant/AssistantActionLinks";
import { AssistantHeader } from "@/components/assistant/AssistantHeader";
import { AssistantSummaryCard } from "@/components/assistant/AssistantSummaryCard";
import { AssistantTimeline } from "@/components/assistant/AssistantTimeline";
import { InsightExplanationCard } from "@/components/assistant/InsightExplanationCard";
import { OpportunityHighlightsPanel } from "@/components/assistant/OpportunityHighlightsPanel";
import { PortfolioInsightsPanel } from "@/components/assistant/PortfolioInsightsPanel";
import { RebalancingSuggestionsPanel } from "@/components/assistant/RebalancingSuggestionsPanel";
import { RiskWarningsPanel } from "@/components/assistant/RiskWarningsPanel";
import { YieldSuggestionsPanel } from "@/components/assistant/YieldSuggestionsPanel";
import { EmptyState } from "@/components/shared";
import { useAssistantInsights } from "@/hooks/useAssistantInsights";

export function AssistantHub({ walletAddress }: { walletAddress?: string }) {
  const { walletAddress: effectiveWalletAddress, summaryQuery, historyQuery, refreshMutation, refresh } = useAssistantInsights(walletAddress);

  if (!effectiveWalletAddress) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8">
        <EmptyState title="Connect a wallet" description="A linked wallet is required before the assistant can generate financial guidance." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AssistantHeader
        mode={summaryQuery.data?.mode || "Rule-Based Insights"}
        generatedAt={summaryQuery.data?.generatedAt}
        summaryText={summaryQuery.data?.summaryText}
        refreshing={refreshMutation.isPending}
        onRefresh={() => {
          void refresh()
            .then(() => toast.success("Assistant insights refreshed"))
            .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to refresh assistant"));
        }}
      />

      <AssistantSummaryCard data={summaryQuery.data} loading={summaryQuery.isLoading} />

      <div className="grid gap-6 xl:grid-cols-2">
        <PortfolioInsightsPanel items={summaryQuery.data?.insights || []} />
        <YieldSuggestionsPanel items={summaryQuery.data?.yieldSuggestions || []} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RiskWarningsPanel items={summaryQuery.data?.riskWarnings || []} />
        <RebalancingSuggestionsPanel items={summaryQuery.data?.rebalancing || []} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <OpportunityHighlightsPanel items={summaryQuery.data?.opportunities || []} />
        <InsightExplanationCard items={summaryQuery.data?.explanation || []} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <AssistantTimeline data={historyQuery.data} />
        <AssistantActionLinks
          items={summaryQuery.data?.actionLinks || []}
          disclaimer={summaryQuery.data?.disclaimer || "Assistant guidance is informational only."}
        />
      </div>
    </div>
  );
}
