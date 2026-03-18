"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ActionButton } from "@/components/dashboard/action-button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { ModalDialog } from "@/components/dashboard/modal-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TxSignatureCard } from "@/components/solana/tx-signature-card";
import { AuthGuard } from "@/components/providers/auth-guard";
import { useGovernance } from "@/hooks/useGovernance";
import { useLending } from "@/hooks/useLending";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useStaking } from "@/hooks/useStaking";
import { OnChainStatusCard } from "@/components/solana/on-chain-status-card";
import { adminApi, adminMonitoringApi } from "@/services/api";
import type { OnChainActionResult, OnChainProgramStatus } from "@/types";
import { formatCompactCurrency, formatDate, formatNumber } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const settingsSchema = z.object({
  rewardRate: z.coerce.number().positive(),
  apyType: z.string().min(2),
  maxStakeLimit: z.coerce.number().positive(),
  poolCapacity: z.coerce.number().positive(),
  earlyWithdrawalFee: z.coerce.number().nonnegative(),
  poolActive: z.boolean(),
  autoCompounding: z.boolean(),
});

const lockPeriodSchema = z.object({
  label: z.string().min(2),
  durationDays: z.coerce.number().positive(),
  apy: z.coerce.number().positive(),
  minAmount: z.coerce.number().positive(),
  penaltyFee: z.coerce.number().nonnegative(),
  enabled: z.boolean(),
});

const emergencyActions = [
  { label: "Pause staking", value: "pause_staking" },
  { label: "Resume staking", value: "resume_staking" },
  { label: "Freeze claims", value: "freeze_claims" },
  { label: "Freeze withdrawals", value: "freeze_withdrawals" },
  { label: "Maintenance mode", value: "maintenance_mode" },
  { label: "Disable pool", value: "disable_pool" },
];

interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  walletAddress: string;
  totalStaked: number;
  rewardEarned: number;
  status: string;
}

function AdminPageContent() {
  const queryClient = useQueryClient();
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [pendingEmergencyAction, setPendingEmergencyAction] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState("");
  const [lastOnChainResult, setLastOnChainResult] = useState<OnChainActionResult | null>(null);
  const staking = useStaking();
  const liquidity = useLiquidity();
  const lending = useLending();
  const governance = useGovernance();
  const onChainAdminReady = staking.isAdmin;

  const settingsQuery = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminApi.settings,
  });
  const lockPeriodsQuery = useQuery({
    queryKey: ["admin", "lock-periods"],
    queryFn: adminApi.lockPeriods,
  });
  const logsQuery = useQuery({
    queryKey: ["admin", "activity-logs", logFilter],
    queryFn: () => adminApi.activityLogs(logFilter),
  });
  const healthQuery = useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: adminApi.systemHealth,
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.users,
  });
  const protocolProgramsQuery = useQuery({
    queryKey: ["admin", "protocol-programs"],
    queryFn: async () => {
      const [stakingConfig, liquidityState, lendingState, governanceConfig] = await Promise.all([
        staking.configQuery.refetch(),
        liquidity.poolsQuery.refetch(),
        lending.marketsQuery.refetch(),
        governance.configQuery.refetch(),
      ]);
      return [
        stakingConfig.data?.program,
        liquidityState.data?.program,
        lendingState.data?.program,
        governanceConfig.data?.program,
      ].filter((status): status is OnChainProgramStatus => Boolean(status));
    },
  });
  const adminOverviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: adminMonitoringApi.overview,
  });
  const adminJobsQuery = useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: adminMonitoringApi.jobs,
  });
  const protocolHealthQuery = useQuery({
    queryKey: ["admin", "protocol-health"],
    queryFn: adminMonitoringApi.protocolHealth,
  });

  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    values: settingsQuery.data
      ? {
          rewardRate: settingsQuery.data.rewardRate,
          apyType: settingsQuery.data.apyType,
          maxStakeLimit: settingsQuery.data.maxStakeLimit,
          poolCapacity: settingsQuery.data.poolCapacity,
          earlyWithdrawalFee: settingsQuery.data.earlyWithdrawalFee,
          poolActive: settingsQuery.data.poolActive,
          autoCompounding: settingsQuery.data.autoCompounding,
        }
      : undefined,
  });

  const lockForm = useForm<z.infer<typeof lockPeriodSchema>>({
    resolver: zodResolver(lockPeriodSchema),
    defaultValues: {
      label: "365 Days",
      durationDays: 365,
      apy: 29.5,
      minAmount: 250,
      penaltyFee: 4,
      enabled: true,
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: () => {
      toast.success("Admin settings saved");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to save settings"),
  });

  const createLockMutation = useMutation({
    mutationFn: adminApi.createLockPeriod,
    onSuccess: () => {
      toast.success("Lock period created");
      setLockModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "lock-periods"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to create lock period"),
  });

  const deleteLockMutation = useMutation({
    mutationFn: adminApi.deleteLockPeriod,
    onSuccess: () => {
      toast.success("Lock period deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "lock-periods"] });
    },
  });

  const emergencyMutation = useMutation({
    mutationFn: (action: string) => adminApi.emergencyAction({ action }),
    onSuccess: () => {
      toast.success("Emergency action executed");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const userColumns = useMemo(
    () => [
      {
        header: "User",
        accessorKey: "name",
        cell: ({ row }: { row: { original: AdminUserRow } }) => (
          <div>
            <div className="font-medium text-white">{row.original.name}</div>
            <div className="text-xs text-slate-500">{row.original.email}</div>
          </div>
        ),
      },
      {
        header: "Wallet / Email",
        accessorKey: "walletAddress",
      },
      {
        header: "Total Staked",
        accessorKey: "totalStaked",
        cell: ({ row }: { row: { original: AdminUserRow } }) => formatNumber(row.original.totalStaked),
      },
      {
        header: "Reward Earned",
        accessorKey: "rewardEarned",
        cell: ({ row }: { row: { original: AdminUserRow } }) => formatNumber(row.original.rewardEarned, 4),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }: { row: { original: AdminUserRow } }) =>
          row.original.status === "admin" ? <RoleBadge role="admin" /> : <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Controls"
        subtitle="Manage staking rewards, lock periods, and pool behavior"
        badge="Admin-only"
        action={
          <div className="glass-panel flex items-center gap-3 px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">System status</div>
              <div className="text-lg font-semibold text-white">
                {settingsQuery.data?.maintenanceMode ? "Maintenance" : "Operational"}
              </div>
            </div>
          </div>
        }
      />

      {protocolProgramsQuery.data ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {protocolProgramsQuery.data.map((status) => (
            <OnChainStatusCard
              key={status.programId}
              status={status}
              heading={`${status.label} authority`}
              body="Protocol trust-sensitive parameters are mapped to Solana program accounts. Admin controls remain available off-chain, but these links expose the authoritative on-chain config surface."
            />
          ))}
        </div>
      ) : null}

      {lastOnChainResult ? <TxSignatureCard result={lastOnChainResult} /> : null}

      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
        <span className="font-medium text-white">On-chain authority:</span>{" "}
        {onChainAdminReady
          ? "Connected wallet matches protocol admin and can sign Anchor admin instructions."
          : "Connected wallet does not match the staking admin PDA authority. Read access is available, but signed on-chain admin actions are disabled."}
      </div>

      <SectionCard
        title="Admin Sync Health Dashboard"
        description="Indexer jobs, mirror freshness, RPC health, and protocol observability grouped as one admin monitoring surface."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Mirrored tx</div>
            <div className="mt-3 text-2xl font-semibold text-white">
              {formatNumber(Number((adminOverviewQuery.data as { totalMirroredTransactions?: number } | undefined)?.totalMirroredTransactions || 0), 0)}
            </div>
            <div className="mt-2 text-sm text-slate-400">Indexed transaction mirror rows for monitoring and analytics.</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">RPC sync</div>
            <div className="mt-3 text-2xl font-semibold text-white capitalize">
              {String((adminOverviewQuery.data as { rpcSyncHealth?: { status?: string } } | undefined)?.rpcSyncHealth?.status || "unknown")}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Latency {formatNumber(Number((adminOverviewQuery.data as { rpcSyncHealth?: { rpcLatency?: number | null } } | undefined)?.rpcSyncHealth?.rpcLatency || 0), 0)} ms
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Last indexer</div>
            <div className="mt-3 text-lg font-semibold text-white">
              {(protocolHealthQuery.data as { lastIndexerRun?: string | null } | undefined)?.lastIndexerRun
                ? formatDate((protocolHealthQuery.data as { lastIndexerRun?: string }).lastIndexerRun!)
                : "Not available"}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Sync status {String((protocolHealthQuery.data as { syncStatus?: string } | undefined)?.syncStatus || "unknown")}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Recent jobs</div>
            <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(adminJobsQuery.data?.length || 0, 0)}</div>
            <div className="mt-2 text-sm text-slate-400">Latest sync, market cache, and analytics rebuild tasks.</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Network monitor</div>
            <div className="mt-3 text-2xl font-semibold text-white capitalize">
              {String(
                (
                  adminOverviewQuery.data as {
                    networkMonitor?: { healthLabel?: string };
                  } | undefined
                )?.networkMonitor?.healthLabel || "unknown",
              )}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              TPS{" "}
              {formatNumber(
                Number(
                  (
                    adminOverviewQuery.data as {
                      networkMonitor?: { tps?: number };
                    } | undefined
                  )?.networkMonitor?.tps || 0,
                ),
                0,
              )}{" "}
              · block time{" "}
              {formatNumber(
                Number(
                  (
                    adminOverviewQuery.data as {
                      networkMonitor?: { blockTime?: number };
                    } | undefined
                  )?.networkMonitor?.blockTime || 0,
                ),
                3,
              )}{" "}
              s
            </div>
          </div>
        </div>
        {adminJobsQuery.data?.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {adminJobsQuery.data.slice(0, 4).map((job) => (
              <div key={job._id || `${job.jobName}-${job.createdAt}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{job.jobName}</div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  {job.finishedAt ? `Completed ${formatDate(job.finishedAt)}` : "Run still active"}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="On-chain protocol controls" description="Signed admin actions sent directly to the deployed Anchor programs.">
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Staking Program</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={staking.pauseMutation.isPending || !onChainAdminReady}
                onClick={() =>
                  staking.pauseMutation.mutate(undefined, {
                    onSuccess: (result) => {
                      setLastOnChainResult(result);
                      toast.success(result.message);
                    },
                    onError: (error) => toast.error(error instanceof Error ? error.message : "Pause failed"),
                  })
                }
              >
                Pause
              </Button>
              <Button
                size="sm"
                disabled={staking.resumeMutation.isPending || !onChainAdminReady}
                onClick={() =>
                  staking.resumeMutation.mutate(undefined, {
                    onSuccess: (result) => {
                      setLastOnChainResult(result);
                      toast.success(result.message);
                    },
                    onError: (error) => toast.error(error instanceof Error ? error.message : "Resume failed"),
                  })
                }
              >
                Resume
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Liquidity Program</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  liquidity.pausePoolMutation.isPending || !liquidity.poolsQuery.data?.pools?.[0] || !onChainAdminReady
                }
                onClick={() =>
                  liquidity.pausePoolMutation.mutate(liquidity.poolsQuery.data!.pools[0].address, {
                    onSuccess: (result) => {
                      setLastOnChainResult(result);
                      toast.success(result.message);
                    },
                    onError: (error) => toast.error(error instanceof Error ? error.message : "Pause failed"),
                  })
                }
              >
                Pause
              </Button>
              <Button
                size="sm"
                disabled={
                  liquidity.resumePoolMutation.isPending || !liquidity.poolsQuery.data?.pools?.[0] || !onChainAdminReady
                }
                onClick={() =>
                  liquidity.resumePoolMutation.mutate(liquidity.poolsQuery.data!.pools[0].address, {
                    onSuccess: (result) => {
                      setLastOnChainResult(result);
                      toast.success(result.message);
                    },
                    onError: (error) => toast.error(error instanceof Error ? error.message : "Resume failed"),
                  })
                }
              >
                Resume
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Lending Program</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  lending.pauseMarketMutation.isPending || !lending.marketsQuery.data?.markets?.[0] || !onChainAdminReady
                }
                onClick={() =>
                  lending.pauseMarketMutation.mutate(lending.marketsQuery.data!.markets[0].address, {
                    onSuccess: (result) => {
                      setLastOnChainResult(result);
                      toast.success(result.message);
                    },
                    onError: (error) => toast.error(error instanceof Error ? error.message : "Pause failed"),
                  })
                }
              >
                Pause
              </Button>
              <Button
                size="sm"
                disabled={
                  lending.resumeMarketMutation.isPending || !lending.marketsQuery.data?.markets?.[0] || !onChainAdminReady
                }
                onClick={() =>
                  lending.resumeMarketMutation.mutate(lending.marketsQuery.data!.markets[0].address, {
                    onSuccess: (result) => {
                      setLastOnChainResult(result);
                      toast.success(result.message);
                    },
                    onError: (error) => toast.error(error instanceof Error ? error.message : "Resume failed"),
                  })
                }
              >
                Resume
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Governance Config</div>
            <Button
              size="sm"
              className="w-full"
              disabled={governance.updateGovernanceConfigMutation.isPending || !onChainAdminReady}
              onClick={() =>
                governance.updateGovernanceConfigMutation.mutate(
                  {
                    quorumBps: Math.round((settingsForm.getValues("rewardRate") || 10) * 100),
                    votingDurationSeconds: 4 * 24 * 60 * 60,
                    proposalThreshold: 1_000,
                  },
                  {
                    onSuccess: (result) => {
                      setLastOnChainResult(result);
                      toast.success(result.message);
                    },
                    onError: (error) => toast.error(error instanceof Error ? error.message : "Governance update failed"),
                  },
                )
              }
            >
              Sync On-chain Config
            </Button>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Reward Rate & Pool Settings"
          description="Tune reward policy, pool capacity, and staking guardrails."
        >
          {settingsQuery.isLoading ? (
            <LoadingSkeleton lines={5} />
          ) : settingsQuery.data ? (
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={settingsForm.handleSubmit((values) => updateSettingsMutation.mutate(values))}
            >
              <div className="space-y-2">
                <Label>Reward Rate %</Label>
                <Input type="number" step="0.01" {...settingsForm.register("rewardRate")} />
              </div>
              <div className="space-y-2">
                <Label>APY Type</Label>
                <Input {...settingsForm.register("apyType")} />
              </div>
              <div className="space-y-2">
                <Label>Max Stake Limit</Label>
                <Input type="number" {...settingsForm.register("maxStakeLimit")} />
              </div>
              <div className="space-y-2">
                <Label>Pool Capacity</Label>
                <Input type="number" {...settingsForm.register("poolCapacity")} />
              </div>
              <div className="space-y-2">
                <Label>Early Withdrawal Fee</Label>
                <Input type="number" step="0.1" {...settingsForm.register("earlyWithdrawalFee")} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 text-sm text-slate-300">Pool Activation</div>
                  <Switch
                    checked={settingsForm.watch("poolActive")}
                    onCheckedChange={(value) => settingsForm.setValue("poolActive", value)}
                  />
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 text-sm text-slate-300">Auto Compounding</div>
                  <Switch
                    checked={settingsForm.watch("autoCompounding")}
                    onCheckedChange={(value) => settingsForm.setValue("autoCompounding", value)}
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    settingsForm.reset({
                      rewardRate: 14.2,
                      apyType: "dynamic",
                      maxStakeLimit: 250000,
                      poolCapacity: 2000000,
                      earlyWithdrawalFee: 2.5,
                      poolActive: true,
                      autoCompounding: true,
                    })
                  }
                >
                  Reset defaults
                </Button>
                <ActionButton type="submit" disabled={updateSettingsMutation.isPending}>
                  Save settings
                </ActionButton>
              </div>
            </form>
          ) : (
            <EmptyState title="No admin settings found" description="Seed data did not load correctly." />
          )}
        </SectionCard>

        <SectionCard title="Pool Health Monitor" description="Live-style telemetry on staking and lending health.">
          {healthQuery.isLoading ? (
            <LoadingSkeleton lines={4} />
          ) : healthQuery.data ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Total locked liquidity", formatCompactCurrency(healthQuery.data.totalLockedLiquidity)],
                ["Active users", formatNumber(healthQuery.data.activeUsers)],
                ["Pending claims", formatNumber(healthQuery.data.pendingClaims, 4)],
                ["Rewards distributed", formatCompactCurrency(healthQuery.data.totalRewardsDistributed)],
                ["Utilization", `${formatNumber(healthQuery.data.utilization)}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</div>
                  <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
                </div>
              ))}
              <div className="rounded-lg border border-amber-400/10 bg-amber-500/5 p-4 md:col-span-2">
                <div className="text-xs uppercase tracking-[0.22em] text-amber-300">System warnings</div>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  {healthQuery.data.warnings?.length > 0 ? healthQuery.data.warnings.map((warning: string) => <div key={warning}>{warning}</div>) : <div>All systems nominal.</div>}
                </div>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Lock Period Management"
          description="Manage built-in and custom staking locks."
          action={
            <ActionButton type="button" onClick={() => setLockModalOpen(true)}>
              Create custom lock
            </ActionButton>
          }
        >
          {lockPeriodsQuery.isLoading ? (
            <LoadingSkeleton lines={5} />
          ) : (
            <div className="space-y-3">
              {lockPeriodsQuery.data?.map((period) => (
                <div key={period._id} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-white">{period.label}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {period.durationDays} days · APY {formatNumber(period.apy)}% · Min {formatNumber(period.minAmount)} · Penalty {formatNumber(period.penaltyFee)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={period.enabled ? "active" : "paused"} />
                    <Button variant="danger" size="sm" onClick={() => deleteLockMutation.mutate(period._id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Emergency Controls" description="Critical actions require explicit confirmation.">
          <div className="grid gap-3 md:grid-cols-2">
            {emergencyActions.map((action) => (
              <button
                key={action.value}
                type="button"
                className="flex items-center justify-between rounded-lg border border-rose-400/12 bg-rose-500/5 px-4 py-4 text-left transition hover:border-rose-300/20 hover:bg-rose-500/8"
                onClick={() => setPendingEmergencyAction(action.value)}
              >
                <div>
                  <div className="font-medium text-white">{action.label}</div>
                  <div className="mt-1 text-sm text-slate-400">Protected admin action</div>
                </div>
                <AlertTriangle className="h-5 w-5 text-rose-300" />
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Admin Actions History"
          description="Recent configuration changes, overrides, and platform actions."
          action={
            <div className="w-48">
              <FilterBar
                value={logFilter || "all"}
                onChange={(value) => setLogFilter(value === "all" ? "" : value)}
                options={[
                  { label: "All logs", value: "all" },
                  { label: "Settings", value: "Settings" },
                  { label: "Lock", value: "Lock" },
                  { label: "Emergency", value: "Emergency" },
                ]}
              />
            </div>
          }
        >
          {logsQuery.isLoading ? (
            <LoadingSkeleton lines={5} />
          ) : logsQuery.data && logsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {logsQuery.data.map((log) => (
                <div key={log._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-white">{log.action}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {log.adminId?.name || "System"} · {log.entityType}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">{formatDate(log.createdAt)}</div>
                  </div>
                  <div className="mt-3 text-sm text-slate-300">
                    Old value → new value updated for <span className="text-white">{log.entityType}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No admin logs" description="Critical actions will appear here." />
          )}
        </SectionCard>

        <SectionCard title="User Management" description="Top users ranked by current staking exposure.">
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            <Users className="h-4 w-4 text-cyan-300" />
            Admin quick actions can be extended from this table.
          </div>
          {usersQuery.isLoading ? (
            <LoadingSkeleton lines={4} />
          ) : usersQuery.data ? (
            <DataTable columns={userColumns as never} data={usersQuery.data as never[]} />
          ) : null}
        </SectionCard>
      </div>

      <ModalDialog open={lockModalOpen} onOpenChange={setLockModalOpen} title="Create Lock Period" description="Add a new lock period configuration to the staking pool.">
        <form
          className="space-y-4"
          onSubmit={lockForm.handleSubmit((values) => createLockMutation.mutate(values))}
        >
          <div className="space-y-2">
            <Label>Label</Label>
            <Input {...lockForm.register("label")} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input type="number" {...lockForm.register("durationDays")} />
            </div>
            <div className="space-y-2">
              <Label>APY</Label>
              <Input type="number" step="0.01" {...lockForm.register("apy")} />
            </div>
            <div className="space-y-2">
              <Label>Min Amount</Label>
              <Input type="number" step="0.01" {...lockForm.register("minAmount")} />
            </div>
            <div className="space-y-2">
              <Label>Penalty Fee</Label>
              <Input type="number" step="0.01" {...lockForm.register("penaltyFee")} />
            </div>
          </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 text-sm text-slate-300">Enabled</div>
              <Switch checked={lockForm.watch("enabled")} onCheckedChange={(value) => lockForm.setValue("enabled", value)} />
            </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setLockModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={staking.createLockPeriodMutation.isPending || !onChainAdminReady}
              onClick={lockForm.handleSubmit((values) =>
                staking.createLockPeriodMutation.mutate(
                  {
                    label: values.label,
                    durationDays: values.durationDays,
                    apyBps: Math.round(values.apy * 100),
                    minAmount: values.minAmount,
                    earlyUnstakePenaltyBps: Math.round(values.penaltyFee * 100),
                    earlyUnstakeEnabled: values.penaltyFee > 0,
                  },
                  {
                    onSuccess: (result) => {
                      setLastOnChainResult(result);
                      toast.success(result.message);
                      setLockModalOpen(false);
                    },
                    onError: (error) =>
                      toast.error(error instanceof Error ? error.message : "On-chain lock creation failed"),
                  },
                ),
              )}
            >
              Create on-chain lock
            </Button>
            <ActionButton type="submit" disabled={createLockMutation.isPending}>
              Create lock
            </ActionButton>
          </div>
        </form>
      </ModalDialog>

      <ConfirmDialog
        open={Boolean(pendingEmergencyAction)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingEmergencyAction(null);
          }
        }}
        title="Confirm emergency action"
        description="This action affects live pool behavior and will be recorded in the audit trail."
        confirmLabel="Execute action"
        tone="danger"
        onConfirm={() => {
          if (pendingEmergencyAction) {
            emergencyMutation.mutate(pendingEmergencyAction);
            setPendingEmergencyAction(null);
          }
        }}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard adminOnly>
      <AdminPageContent />
    </AuthGuard>
  );
}
