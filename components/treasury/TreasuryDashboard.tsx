"use client";

import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/dashboard/empty-state";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { SectionCard } from "@/components/dashboard/section-card";
import { useTreasury } from "@/hooks/useTreasury";
import { SpendingProposalsPanel } from "@/components/treasury/SpendingProposalsPanel";
import { TreasuryAllocationChart } from "@/components/treasury/TreasuryAllocationChart";
import { TreasuryAssetsTable } from "@/components/treasury/TreasuryAssetsTable";
import { TreasuryEventTimeline } from "@/components/treasury/TreasuryEventTimeline";
import { TreasuryFlowChart } from "@/components/treasury/TreasuryFlowChart";
import { TreasuryGrowthChart } from "@/components/treasury/TreasuryGrowthChart";
import { TreasuryHeader } from "@/components/treasury/TreasuryHeader";
import { TreasuryHealthCard } from "@/components/treasury/TreasuryHealthCard";
import { TreasuryOverviewCards } from "@/components/treasury/TreasuryOverviewCards";
import { TreasuryRecommendationsPanel } from "@/components/treasury/TreasuryRecommendationsPanel";
import { TreasuryRunwayCard } from "@/components/treasury/TreasuryRunwayCard";
import { formatCompactCurrency } from "@/utils/format";

export function TreasuryDashboard() {
  const treasury = useTreasury();
  const overview = treasury.overviewQuery.data;

  if (treasury.isLoading && !overview) {
    return <LoadingSkeleton lines={10} />;
  }

  return (
    <div className="space-y-6">
      <TreasuryHeader overview={overview} range={treasury.range} onRangeChange={treasury.setRange} />

      {!treasury.isConfigured ? (
        <SectionCard title="Treasury Configuration" description="Governance-linked treasury configuration has not been detected yet.">
          <EmptyState
            title="Treasury not configured yet"
            description="Add treasury wallets or seed treasury config to activate on-chain reserve analytics and proposal-linked spending panels."
          />
        </SectionCard>
      ) : (
        <>
          <TreasuryOverviewCards overview={overview} />

          <SectionCard title="Treasury Wallets" description="Multiple treasury buckets mapped to explorer shortcuts and holdings coverage.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {overview?.wallets?.map((wallet) => (
                <div key={wallet.address} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{wallet.label}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{wallet.category}</div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
                      onClick={async () => {
                        await navigator.clipboard.writeText(wallet.address);
                        toast.success("Treasury wallet copied");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-4 text-lg font-semibold text-white">{formatCompactCurrency(wallet.value)}</div>
                  <div className="mt-1 text-sm text-slate-400">{wallet.shortAddress}</div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>{wallet.holdingsCount} holdings</span>
                    <a href={wallet.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100">
                      Explorer
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <TreasuryGrowthChart data={treasury.growthQuery.data} />

          <div className="grid gap-6 xl:grid-cols-2">
            <TreasuryAllocationChart data={treasury.allocationQuery.data} />
            <TreasuryHealthCard data={treasury.healthQuery.data} />
          </div>

          <TreasuryAssetsTable data={treasury.assetsQuery.data} />

          <div className="grid gap-6 xl:grid-cols-2">
            <SpendingProposalsPanel data={treasury.proposalsQuery.data} />
            <TreasuryRunwayCard data={treasury.runwayQuery.data} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <TreasuryFlowChart data={treasury.flowsQuery.data} />
            <TreasuryRecommendationsPanel overview={overview} health={treasury.healthQuery.data} />
          </div>

          <TreasuryEventTimeline data={treasury.eventsQuery.data} />
        </>
      )}
    </div>
  );
}
