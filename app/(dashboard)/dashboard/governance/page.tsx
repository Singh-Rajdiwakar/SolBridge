"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BellRing, Vote } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ActionButton } from "@/components/dashboard/action-button";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { FilterTabs } from "@/components/shared";
import { useGovernance } from "@/hooks/useGovernance";
import { TreasuryDashboard } from "@/components/treasury";
import { alertsApi, governanceApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import type { OnChainActionResult, Proposal, VoteRecord } from "@/types";
import { formatCompactCurrency, formatDate, formatNumber, formatPercent } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnChainStatusCard } from "@/components/solana/on-chain-status-card";
import { TxSignatureCard } from "@/components/solana/tx-signature-card";

const proposalSchema = z.object({
  title: z.string().min(4),
  category: z.string().min(2),
  description: z.string().min(12),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  quorum: z.coerce.number().positive(),
});

export default function GovernancePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const activeProposalId = useUiStore((state) => state.activeProposalId);
  const setActiveProposalId = useUiStore((state) => state.setActiveProposalId);
  const [statusFilter, setStatusFilter] = useState("active");
  const [lastOnChainResult, setLastOnChainResult] = useState<OnChainActionResult | null>(null);
  const governance = useGovernance();
  const onChainConfigQuery = governance.configQuery;

  const statsQuery = useQuery({
    queryKey: ["governance", "stats"],
    queryFn: governanceApi.stats,
  });
  const proposalsQuery = useQuery({
    queryKey: ["governance", "proposals", statusFilter],
    queryFn: () => governanceApi.proposals(statusFilter),
  });
  const vestingQuery = useQuery({
    queryKey: ["governance", "vesting"],
    queryFn: governanceApi.vesting,
  });
  const myVotesQuery = useQuery({
    queryKey: ["governance", "my-votes"],
    queryFn: governanceApi.myVotes,
  });
  const reminderAlertsQuery = useQuery({
    queryKey: ["governance", "reminder-alerts"],
    queryFn: alertsApi.list,
  });
  const proposalDetailQuery = useQuery({
    queryKey: ["governance", "proposal", activeProposalId],
    queryFn: () => governanceApi.proposal(activeProposalId!),
    enabled: Boolean(activeProposalId),
  });

  useEffect(() => {
    if (!activeProposalId && proposalsQuery.data?.[0]) {
      setActiveProposalId(proposalsQuery.data[0]._id);
    }
  }, [activeProposalId, proposalsQuery.data, setActiveProposalId]);

  const proposalForm = useForm<z.infer<typeof proposalSchema>>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "Launch validator delegation rewards",
      category: "Treasury",
      description: "Route a defined portion of validator revenue to long-term governance participants.",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      quorum: 60,
    },
  });

  const voteMutation = useMutation({
    mutationFn: governanceApi.vote,
    onSuccess: () => {
      toast.success("Vote submitted");
      queryClient.invalidateQueries({ queryKey: ["governance"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Voting failed"),
  });

  const createProposalMutation = useMutation({
    mutationFn: governanceApi.createProposal,
    onSuccess: () => {
      toast.success("Proposal published");
      queryClient.invalidateQueries({ queryKey: ["governance"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to create proposal"),
  });
  const claimMutation = useMutation({
    mutationFn: governanceApi.claim,
    onSuccess: () => {
      toast.success("Governance rewards claimed");
      queryClient.invalidateQueries({ queryKey: ["governance"] });
    },
  });
  const reminderMutation = useMutation({
    mutationFn: (proposal: Proposal) =>
      alertsApi.create({
        type: "governance",
        target: proposal._id,
        condition: "proposal_ending",
        threshold: Math.max(1, Math.round((new Date(proposal.endDate).getTime() - Date.now()) / 3600000)),
        walletAddress: user?.walletAddress,
      }),
    onSuccess: () => {
      toast.success("Governance reminder saved");
      queryClient.invalidateQueries({ queryKey: ["governance", "reminder-alerts"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Reminder creation failed"),
  });
  const removeReminderMutation = useMutation({
    mutationFn: (id: string) => alertsApi.remove(id),
    onSuccess: () => {
      toast.success("Governance reminder removed");
      queryClient.invalidateQueries({ queryKey: ["governance", "reminder-alerts"] });
    },
  });

  const stats = statsQuery.data
    ? [
        { title: "Active Proposals", value: statsQuery.data.activeProposals, change: 5.4, chartData: [{ value: statsQuery.data.activeProposals }] },
        { title: "Total Votes Cast", value: statsQuery.data.totalVotesCast, change: 6.8, chartData: [{ value: statsQuery.data.totalVotesCast }] },
        { title: "Your Voting Power", value: statsQuery.data.yourVotingPower, change: 2.4, chartData: [{ value: statsQuery.data.yourVotingPower }] },
        { title: "Treasury Participation", value: statsQuery.data.treasuryParticipation, change: 1.2, suffix: "%", chartData: [{ value: statsQuery.data.treasuryParticipation }] },
      ]
    : [];

  const activeProposal = proposalDetailQuery.data as Proposal | undefined;
  const governanceAlerts = (reminderAlertsQuery.data || []).filter((alert) => alert.type === "governance");
  const activeOnChainProposal = useMemo(
    () =>
      governance.proposalsQuery.data?.find((proposal) => proposal.title.toLowerCase() === activeProposal?.title.toLowerCase()) ||
      governance.proposalsQuery.data?.[0],
    [activeProposal?.title, governance.proposalsQuery.data],
  );
  const totalVotes = activeProposal
    ? activeProposal.votesYes + activeProposal.votesNo + activeProposal.votesAbstain
    : 0;
  const activeTab = useMemo(
    () => (searchParams.get("tab") === "treasury" ? "treasury" : "overview"),
    [searchParams],
  );
  const headerTitle = activeTab === "treasury" ? "DAO Treasury Dashboard" : "Governance Voting";
  const headerSubtitle =
    activeTab === "treasury"
      ? "Treasury assets, runway, reserve allocation, inflow/outflow monitoring, and proposal-linked capital governance."
      : "Vote on protocol upgrades, treasury changes, and ecosystem proposals";
  const headerBadge = activeTab === "treasury" ? "Treasury Intelligence" : undefined;

  const historyColumns = useMemo(
    () => [
      {
        header: "Proposal",
        accessorKey: "proposalId.title",
        cell: ({ row }: { row: { original: VoteRecord } }) => row.original.proposalId.title,
      },
      { header: "Your Vote", accessorKey: "voteType" },
      { header: "Result", accessorKey: "proposalId.status", cell: ({ row }: { row: { original: VoteRecord } }) => <StatusBadge status={row.original.proposalId.status} /> },
      { header: "Reward", accessorKey: "reward", cell: ({ row }: { row: { original: VoteRecord } }) => formatNumber(row.original.reward) },
      { header: "Date", accessorKey: "createdAt", cell: ({ row }: { row: { original: VoteRecord } }) => formatDate(row.original.createdAt) },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        badge={headerBadge}
        action={
          <FilterTabs
            items={[
              { label: "Overview", value: "overview" },
              { label: "Treasury", value: "treasury" },
            ]}
            active={activeTab}
            onChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("tab", value);
              router.replace(`/dashboard/governance?${params.toString()}`);
            }}
          />
        }
      />

      {activeTab === "treasury" ? (
        <TreasuryDashboard />
      ) : (
        <>
      {onChainConfigQuery.data ? (
        <OnChainStatusCard
          status={onChainConfigQuery.data.program}
          heading="On-chain governance state"
          body="Proposal accounts and vote records are mapped to the Anchor governance program. Once deployed, the explorer links here let reviewers verify proposal quorum and voting power directly on Solana."
        />
      ) : null}

      {lastOnChainResult ? <TxSignatureCard result={lastOnChainResult} /> : null}

      {governance.proposalsQuery.data?.length ? (
        <SectionCard
          title="On-chain proposals"
          description="Proposal accounts decoded directly from the governance program."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {governance.proposalsQuery.data.slice(0, 4).map((proposal) => (
              <div key={proposal.address} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{proposal.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{proposal.address}</div>
                  </div>
                  <StatusBadge status={proposal.status} />
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <div className="flex justify-between"><span>Yes</span><span>{formatNumber(proposal.yesVotes)}</span></div>
                  <div className="flex justify-between"><span>No</span><span>{formatNumber(proposal.noVotes)}</span></div>
                  <div className="flex justify-between"><span>Abstain</span><span>{formatNumber(proposal.abstainVotes)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {statsQuery.isLoading || proposalsQuery.isLoading ? (
        <LoadingSkeleton lines={6} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <StatCard key={item.title} item={item} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard
              title="Proposal List"
              description="Filter active and historical governance proposals."
              action={
                <FilterBar
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: "Active", value: "active" },
                    { label: "Passed", value: "passed" },
                    { label: "Rejected", value: "rejected" },
                    { label: "Pending", value: "pending" },
                    { label: "Archived", value: "archived" },
                  ]}
                />
              }
            >
              <div className="space-y-3">
                {proposalsQuery.data?.map((proposal) => (
                  <button
                    type="button"
                    key={proposal._id}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      activeProposalId === proposal._id
                        ? "border-cyan-300/30 bg-cyan-400/10 shadow-neon"
                        : "border-white/10 bg-white/[0.03] hover:border-cyan-300/20 hover:bg-white/[0.05]"
                    }`}
                    onClick={() => setActiveProposalId(proposal._id)}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-medium text-white">{proposal.title}</div>
                        <div className="mt-1 text-sm text-slate-400">
                          {proposal.category} · by {proposal.proposerId?.name || "Unknown"}
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
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Active Proposal Detail" description="Review live vote distribution and cast your vote.">
              {activeProposal ? (
                <div className="space-y-5">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm text-slate-400">{activeProposal.category}</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{activeProposal.title}</div>
                      </div>
                      <StatusBadge status={activeProposal.status} />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">{activeProposal.description}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      ["Yes", activeProposal.votesYes],
                      ["No", activeProposal.votesNo],
                      ["Abstain", activeProposal.votesAbstain],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</div>
                        <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(value as number)}</div>
                        <div className="mt-2 text-sm text-slate-400">
                          {totalVotes > 0 ? formatPercent(((value as number) / totalVotes) * 100) : "0%"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                      <span>Quorum progress</span>
                      <span>{formatPercent(activeProposal.participation)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${Math.min(100, activeProposal.participation)}%` }} />
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Time remaining until {formatDate(activeProposal.endDate)}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[ 
                      ["Vote Yes", "yes"],
                      ["Vote No", "no"],
                      ["Abstain", "abstain"],
                    ].map(([label, voteType]) => (
                      <div key={voteType} className="grid gap-2">
                        <ActionButton type="button" onClick={() => voteMutation.mutate({ proposalId: activeProposal._id, voteType })}>
                          {label}
                        </ActionButton>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            activeOnChainProposal
                              ? governance.castVoteMutation.mutate(
                                  { proposal: activeOnChainProposal.address, voteType },
                                  {
                                    onSuccess: (result) => {
                                      setLastOnChainResult(result);
                                      toast.success(result.message);
                                    },
                                    onError: (error) => toast.error(error instanceof Error ? error.message : "On-chain vote failed"),
                                  },
                                )
                              : toast.error("No on-chain proposal account found for this vote")
                          }
                          disabled={governance.castVoteMutation.isPending}
                        >
                          On-chain Beta
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Governance reminder alerts</div>
                        <div className="mt-1 text-sm text-slate-400">
                          Save a reminder before the current voting window expires.
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={!activeProposal || reminderMutation.isPending}
                        onClick={() => activeProposal && reminderMutation.mutate(activeProposal)}
                      >
                        <BellRing className="h-4 w-4" />
                        Create Reminder
                      </Button>
                    </div>
                    {governanceAlerts.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {governanceAlerts.slice(0, 4).map((alert) => (
                          <div key={alert._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-white">{alert.condition.replaceAll("_", " ")}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                                target {alert.target} • threshold {alert.threshold}h
                              </div>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => removeReminderMutation.mutate(alert._id)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-slate-400">
                        No governance reminders saved yet. Create one to receive a product-level reminder before proposal close.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState title="No proposal selected" description="Pick a proposal from the list to inspect voting details." />
              )}
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard
              title="Vote Power / Vesting Details"
              description="Track locked governance exposure and claimable rewards."
              action={
                <Button onClick={() => claimMutation.mutate()} disabled={claimMutation.isPending}>
                  Claim rewards
                </Button>
              }
            >
              {vestingQuery.isLoading ? (
                <LoadingSkeleton lines={5} />
              ) : vestingQuery.data ? (
                <div className="space-y-3">
                  {[
                    ["Locked governance tokens", formatNumber(vestingQuery.data.lockedGovernanceTokens)],
                    ["Vesting duration", `${vestingQuery.data.vestingDuration} days`],
                    ["Current voting power", formatNumber(vestingQuery.data.currentVotingPower)],
                    ["Delegated power", formatNumber(vestingQuery.data.delegatedPower)],
                    ["Claimable rewards", formatCompactCurrency(vestingQuery.data.claimableGovernanceRewards)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4">
                      <div className="text-sm text-slate-400">{label}</div>
                      <div className="text-lg font-semibold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Voting Timeline / Chart" description="Aggregate governance trend across the selected proposal.">
              {activeProposal ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { label: "Start", value: 0 },
                        { label: "Day 1", value: activeProposal.votesYes * 0.24 },
                        { label: "Day 2", value: activeProposal.votesYes * 0.46 },
                        { label: "Day 3", value: activeProposal.votesYes * 0.71 },
                        { label: "Today", value: activeProposal.votesYes },
                      ]}
                    >
                      <defs>
                        <linearGradient id="voteTrend" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#35D8FF" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#35D8FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(8, 12, 28, 0.96)",
                          border: "1px solid rgba(53, 216, 255, 0.12)",
                          borderRadius: "16px",
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#35D8FF" fill="url(#voteTrend)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </SectionCard>
          </div>

          {user?.role === "admin" || (vestingQuery.data?.currentVotingPower || 0) >= 1000 ? (
            <SectionCard title="Proposal Creation Form" description="Create and publish a new protocol or treasury vote.">
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={proposalForm.handleSubmit((values) =>
                  createProposalMutation.mutate({
                    ...values,
                    startDate: new Date(values.startDate).toISOString(),
                    endDate: new Date(values.endDate).toISOString(),
                  }),
                )}
              >
                <div className="space-y-2">
                  <Label>Proposal title</Label>
                  <Input {...proposalForm.register("title")} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input {...proposalForm.register("category")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Markdown description</Label>
                  <Textarea {...proposalForm.register("description")} />
                </div>
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input type="datetime-local" {...proposalForm.register("startDate")} />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input type="datetime-local" {...proposalForm.register("endDate")} />
                </div>
                <div className="space-y-2">
                  <Label>Minimum quorum</Label>
                  <Input type="number" {...proposalForm.register("quorum")} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={governance.createProposalMutation.isPending}
                      onClick={proposalForm.handleSubmit((values) =>
                        governance.createProposalMutation.mutate(
                          {
                            title: values.title,
                            metadataUri: `retix://proposal/${encodeURIComponent(values.category)}`,
                            descriptionHash: `${values.category}:${values.quorum}`,
                            startDate: new Date(values.startDate).toISOString(),
                            endDate: new Date(values.endDate).toISOString(),
                          },
                          {
                            onSuccess: (result) => {
                              setLastOnChainResult(result);
                              toast.success(result.message);
                            },
                            onError: (error) => toast.error(error instanceof Error ? error.message : "On-chain proposal creation failed"),
                          },
                        ),
                      )}
                    >
                      {governance.createProposalMutation.isPending ? "Preparing..." : "On-chain Beta"}
                    </Button>
                    <ActionButton type="submit" disabled={createProposalMutation.isPending}>
                      Publish proposal
                    </ActionButton>
                  </div>
                </div>
              </form>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Past Governance Activity"
            description="Review your vote history, outcomes, rewards, and timestamps."
            action={
              <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
                <Vote className="mr-2 inline-block h-4 w-4 text-cyan-300" />
                Governance archive
              </div>
            }
          >
            {myVotesQuery.isLoading ? (
              <LoadingSkeleton lines={4} />
            ) : myVotesQuery.data && myVotesQuery.data.length > 0 ? (
              <DataTable columns={historyColumns as never} data={myVotesQuery.data as never[]} />
            ) : (
              <EmptyState title="No governance activity" description="Vote on a proposal to populate your governance history." />
            )}
          </SectionCard>
        </>
      )}
        </>
      )}
    </div>
  );
}
