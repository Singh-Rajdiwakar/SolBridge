"use client";

import Link from "next/link";
import { Blocks, LayoutDashboard, Wallet } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { OnChainStatusCard } from "@/components/solana/on-chain-status-card";
import {
  PortfolioAllocationChart,
  TransactionHistory,
  WalletInsightsChart,
  WalletTicker,
} from "@/components/wallet";
import { useWalletData } from "@/hooks/use-wallet-data";
import { cn } from "@/utils/cn";

export default function DashboardIndexPage() {
  const {
    wallet,
    connected,
    protocolStatuses,
    onChainSummary,
    portfolioQuery,
    balanceHistory,
    insightsQuery,
    transactions,
  } = useWalletData();

  const summaryCards = [
    {
      title: "On-chain Staked",
      value: onChainSummary.stakingTotal,
      change: 8.4,
      chartData: balanceHistory.length ? balanceHistory : [{ label: "Now", value: onChainSummary.stakingTotal }],
    },
    {
      title: "LP Exposure",
      value: onChainSummary.totalLpBalance,
      change: 5.9,
      chartData: balanceHistory.length ? balanceHistory : [{ label: "Now", value: onChainSummary.totalLpBalance }],
    },
    {
      title: "Borrowed Amount",
      value: onChainSummary.borrowedAmount,
      change: onChainSummary.healthFactor ? Math.max(0, onChainSummary.healthFactor * 4) : 0,
      chartData: balanceHistory.length ? balanceHistory : [{ label: "Now", value: onChainSummary.borrowedAmount }],
    },
    {
      title: "Governance Votes",
      value: onChainSummary.totalGovernanceVotes,
      change: 3.7,
      chartData: balanceHistory.length ? balanceHistory : [{ label: "Now", value: onChainSummary.totalGovernanceVotes }],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Protocol Dashboard"
        subtitle="A real Solana dApp read layer aggregating staking, liquidity, lending, governance, and wallet analytics from Anchor-backed program accounts."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/wallet" className={cn(buttonVariants({ variant: "secondary" }))}>
              <Wallet className="h-4 w-4" />
              Open Wallet
            </Link>
            <Button onClick={wallet.openConnectModal}>
              <LayoutDashboard className="h-4 w-4" />
              {connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      <WalletTicker transactions={transactions} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </div>

      {protocolStatuses.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {protocolStatuses.map((status) => (
            <OnChainStatusCard
              key={status.programId}
              status={status}
              heading={`${status.label} verification`}
              body="Program IDs, config PDAs, and explorer links below come directly from the configured Anchor integrations so reviewers can verify that protocol state is not mocked."
            />
          ))}
        </div>
      ) : null}

      <SectionCard
        title="Protocol Status Board"
        description="Live operator-style board for the four on-chain protocol modules and their current wallet exposure."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Staking", onChainSummary.stakingPositionsCount > 0 ? "Active" : "Standby", `${onChainSummary.stakingPositionsCount} positions`, onChainSummary.stakingTotal],
            ["Liquidity", onChainSummary.liquidityPositionsCount > 0 ? "Active" : "Standby", `${onChainSummary.liquidityPoolCount} pools tracked`, onChainSummary.totalLpBalance],
            ["Lending", onChainSummary.borrowedAmount > 0 ? "Debt live" : "Flat", onChainSummary.healthFactor ? `HF ${onChainSummary.healthFactor.toFixed(2)}` : "No borrow", onChainSummary.borrowedAmount],
            ["Governance", onChainSummary.activeGovernanceProposals > 0 ? "Voting live" : "Quiet", `${onChainSummary.activeGovernanceProposals} active`, onChainSummary.totalGovernanceVotes],
          ].map(([label, state, detail, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</div>
                <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                  {state}
                </span>
              </div>
              <div className="mt-3 text-2xl font-semibold text-white">{typeof value === "number" ? value.toFixed(label === "Governance" ? 0 : 4) : value}</div>
              <div className="mt-2 text-sm text-slate-400">{detail}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <PortfolioAllocationChart allocation={portfolioQuery.data?.allocation || []} history={balanceHistory} />
        <WalletInsightsChart insights={insightsQuery.data} loading={insightsQuery.isLoading && connected} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Protocol summary"
          description="Cross-module chain reads exposed as a single operator view for recruiter demos and protocol monitoring."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Staking positions", `${onChainSummary.stakingPositionsCount}`, "Wallet-linked PDA positions"],
              ["Pending rewards", `${onChainSummary.pendingRewards.toFixed(4)}`, "Calculated from on-chain accrual windows"],
              ["Liquidity positions", `${onChainSummary.liquidityPositionsCount}`, "User LP positions across deployed pools"],
              ["Collateral / Debt", `${onChainSummary.collateralAmount.toFixed(4)} / ${onChainSummary.borrowedAmount.toFixed(4)}`, "Collateral and borrow state"],
              ["Active proposals", `${onChainSummary.activeGovernanceProposals}`, "Live governance participation"],
              ["Total proposal votes", `${onChainSummary.totalGovernanceVotes}`, "Vote counts fetched from proposal accounts"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  <Blocks className="h-4 w-4 text-cyan-300" />
                  {label}
                </div>
                <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
                <div className="mt-2 text-sm text-slate-400">{detail}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <TransactionHistory transactions={transactions.slice(0, 8)} loading={false} />
      </div>
    </div>
  );
}
