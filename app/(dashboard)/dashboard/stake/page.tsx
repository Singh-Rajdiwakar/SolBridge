"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, History, Sparkles, Wallet2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ActionButton } from "@/components/dashboard/action-button";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { ModalDialog } from "@/components/dashboard/modal-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TokenRow } from "@/components/dashboard/token-row";
import { OnChainStatusCard } from "@/components/solana/on-chain-status-card";
import { TxSignatureCard } from "@/components/solana/tx-signature-card";
import { TOKEN_OPTIONS } from "@/lib/constants";
import { useStaking } from "@/hooks/useStaking";
import { stakingApi } from "@/services/api";
import type { LockPeriod, OnChainActionResult, TransactionRecord } from "@/types";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const calculatorSchema = z.object({
  amount: z.coerce.number().positive(),
  durationDays: z.coerce.number().positive(),
  apy: z.coerce.number().positive(),
});

const stakeSchema = z.object({
  tokenSymbol: z.string().min(2),
  amount: z.coerce.number().positive(),
  durationDays: z.coerce.number().positive(),
});

function estimateLockReturn(lockPeriod: LockPeriod, amount = Math.max(lockPeriod.minAmount, 100)) {
  return (amount * (lockPeriod.apy / 100) * lockPeriod.durationDays) / 365;
}

export default function StakeDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<number | null>(null);
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [lastOnChainResult, setLastOnChainResult] = useState<OnChainActionResult | null>(null);
  const staking = useStaking();
  const onChainConfigQuery = staking.configQuery;

  const overviewQuery = useQuery({
    queryKey: ["staking", "overview", selectedToken],
    queryFn: () => stakingApi.overview(selectedToken),
  });

  const historyQuery = useQuery({
    queryKey: ["staking", "history", selectedToken],
    queryFn: () => stakingApi.history(selectedToken) as Promise<TransactionRecord[]>,
  });

  const calculatorForm = useForm<z.infer<typeof calculatorSchema>>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      amount: 150,
      durationDays: 30,
      apy: 12.4,
    },
  });

  const [calculatedReward, setCalculatedReward] = useState<{ estimatedReward: number; projectedValue: number } | null>(
    null,
  );

  const calculatorMutation = useMutation({
    mutationFn: stakingApi.calculate,
    onSuccess: (data) => setCalculatedReward(data),
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Calculation failed"),
  });

  const stakeForm = useForm<z.infer<typeof stakeSchema>>({
    resolver: zodResolver(stakeSchema),
    defaultValues: {
      tokenSymbol: selectedToken,
      amount: 50,
      durationDays: 30,
    },
  });

  const stakeMutation = useMutation({
    mutationFn: stakingApi.create,
    onSuccess: () => {
      toast.success("Stake created successfully");
      setStakeModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["staking"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to create stake"),
  });

  const columns = useMemo(
    () => [
      {
        header: "Type",
        accessorKey: "type",
        cell: ({ row }: { row: { original: TransactionRecord } }) => (
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-cyan-400/10 bg-cyan-400/10 p-2">
              <History className="h-4 w-4 text-cyan-300" />
            </div>
            <div>
              <div className="font-medium text-white">{row.original.type}</div>
              <div className="text-xs text-slate-500">{row.original.token}</div>
            </div>
          </div>
        ),
      },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ row }: { row: { original: TransactionRecord } }) => (
          <span className="font-medium text-white">{formatNumber(row.original.amount)}</span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }: { row: { original: TransactionRecord } }) => <StatusBadge status={row.original.status} />,
      },
      {
        header: "Timestamp",
        accessorKey: "createdAt",
        cell: ({ row }: { row: { original: TransactionRecord } }) => (
          <span className="text-slate-400">{formatDate(row.original.createdAt)}</span>
        ),
      },
    ],
    [],
  );

  const overview = overviewQuery.data;
  const rewardForecastData = useMemo(() => {
    if (!overview) {
      return [];
    }
    const forecastAmount = Math.max(overview.portfolio.stakedAmount || 100, 100);
    return [30, 90, 180, 365].map((days) => {
      const matchingPeriod =
        overview.lockPeriods.find((period) => period.durationDays === days) ||
        overview.lockPeriods[overview.lockPeriods.length - 1];
      const apy = matchingPeriod?.apy || 12;
      const reward = (forecastAmount * (apy / 100) * days) / 365;
      return {
        label: `${days}d`,
        reward,
        value: forecastAmount + reward,
      };
    });
  }, [overview]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staking Dashboard"
        subtitle="Stake your tokens and earn rewards"
        action={
          <div className="glass-panel flex items-center gap-3 px-4 py-3">
            <Wallet2 className="h-4 w-4 text-cyan-300" />
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Wallet balance</div>
              <div className="text-lg font-semibold text-white">
                {overview ? `${formatNumber(overview.walletBalance)} ${selectedToken}` : "--"}
              </div>
            </div>
          </div>
        }
      />

      {onChainConfigQuery.data ? (
        <OnChainStatusCard
          status={onChainConfigQuery.data.program}
          heading="On-chain staking positions"
          body="Lock periods, reward policy, and user stake positions are modeled for the Anchor staking program. Once deployed to Devnet, this panel points directly to the authoritative Solana accounts."
        />
      ) : null}

      {lastOnChainResult ? <TxSignatureCard result={lastOnChainResult} /> : null}

      {staking.positionsQuery.data ? (
        <SectionCard
          title="On-chain stake positions"
          description="Positions fetched from Anchor PDA accounts for the connected wallet."
        >
          {staking.wallet.connected ? (
            staking.positionsQuery.data.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {staking.positionsQuery.data.map((position) => (
                  <div key={position.address} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{position.lockLabel || `${position.durationDays} Day Lock`}</div>
                        <div className="mt-1 text-sm text-slate-400">
                          {formatNumber(position.amount)} staked • Pending {formatNumber(position.pendingRewards || 0, 4)}
                        </div>
                      </div>
                      <StatusBadge status={position.unstaked ? "closed" : "active"} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={staking.claimMutation.isPending || position.unstaked}
                        onClick={() =>
                          staking.claimMutation.mutate(position.address, {
                            onSuccess: (result) => {
                              setLastOnChainResult(result);
                              toast.success(result.message);
                            },
                            onError: (error) => toast.error(error instanceof Error ? error.message : "Claim failed"),
                          })
                        }
                      >
                        Claim
                      </Button>
                      <Button
                        size="sm"
                        disabled={staking.unstakeMutation.isPending || position.unstaked}
                        onClick={() =>
                          staking.unstakeMutation.mutate(position.address, {
                            onSuccess: (result) => {
                              setLastOnChainResult(result);
                              toast.success(result.message);
                            },
                            onError: (error) => toast.error(error instanceof Error ? error.message : "Unstake failed"),
                          })
                        }
                      >
                        Unstake
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No on-chain stake positions" description="Create a stake with the On-chain Beta flow to initialize your first PDA-backed position." />
            )
          ) : (
            <EmptyState title="Connect a wallet" description="Wallet connection is required to fetch user stake positions from Solana." />
          )}
        </SectionCard>
      ) : null}

      {overviewQuery.isLoading ? (
        <LoadingSkeleton lines={6} />
      ) : overview ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview.stats.map((item) => (
              <StatCard key={item.title} item={item} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <SectionCard
              title="Portfolio Overview"
              description="Track your token performance and reward growth in one view."
              action={
                <FilterBar
                  value={selectedToken}
                  onChange={(value) => {
                    setSelectedToken(value);
                    stakeForm.setValue("tokenSymbol", value);
                  }}
                  options={TOKEN_OPTIONS.map((token) => ({ label: token.label, value: token.value }))}
                />
              }
            >
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <TokenRow
                  token={overview.portfolio.token}
                  label="Selected staking asset"
                  value={
                    <div className="text-right">
                      <div className="font-medium text-white">{formatNumber(overview.portfolio.stakedAmount)} staked</div>
                      <div className="text-xs text-slate-500">Reward growth {formatNumber(overview.portfolio.rewardGrowth, 4)}</div>
                    </div>
                  }
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Staked amount</div>
                    <div className="mt-3 text-2xl font-semibold text-white">
                      {formatNumber(overview.portfolio.stakedAmount)} {overview.portfolio.token}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Fiat value</div>
                    <div className="mt-3 text-2xl font-semibold text-white">{formatCurrency(overview.portfolio.fiatValue)}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Reward growth</div>
                    <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(overview.portfolio.rewardGrowth, 4)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.portfolio.chartData}>
                    <defs>
                      <linearGradient id="stakeGradient" x1="0" x2="0" y1="0" y2="1">
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
                    <Area type="monotone" dataKey="value" stroke="#35D8FF" fill="url(#stakeGradient)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Rewards Calculator" description="Preview your staking outcome with live reward math.">
              <form
                className="space-y-4"
                onSubmit={calculatorForm.handleSubmit((values) => calculatorMutation.mutate(values))}
              >
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" step="0.01" {...calculatorForm.register("amount")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationDays">Duration</Label>
                  <Input id="durationDays" type="number" {...calculatorForm.register("durationDays")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apy">APY</Label>
                  <Input id="apy" type="number" step="0.01" {...calculatorForm.register("apy")} />
                </div>
                <ActionButton type="submit" className="w-full">
                  Calculate
                </ActionButton>
              </form>

              <div className="mt-5 grid gap-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Estimated reward</div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {calculatedReward ? formatNumber(calculatedReward.estimatedReward, 6) : "--"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Projected value</div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {calculatedReward ? formatNumber(calculatedReward.projectedValue, 6) : "--"}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Lock Period Options" description="Choose the lock profile that fits your conviction horizon.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {overview.lockPeriods.map((period) => {
                const selected = selectedLockPeriod === period.durationDays;
                return (
                  <div
                    key={period._id}
                    className={`rounded-lg border p-5 transition ${
                      selected
                        ? "border-cyan-300/30 bg-cyan-400/10 shadow-neon"
                        : "border-white/10 bg-white/[0.03] hover:border-cyan-300/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-slate-400">{period.label}</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{formatPercent(period.apy)}</div>
                      </div>
                      <Sparkles className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-400">
                      <div className="flex justify-between">
                        <span>Estimated return</span>
                        <span className="text-white">{formatNumber(estimateLockReturn(period), 4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minimum stake</span>
                        <span className="text-white">{period.minAmount}</span>
                      </div>
                    </div>
                    <Button
                      className="mt-5 w-full"
                      onClick={() => {
                        setSelectedLockPeriod(period.durationDays);
                        stakeForm.setValue("durationDays", period.durationDays);
                        setStakeModalOpen(true);
                      }}
                    >
                      Stake Now
                    </Button>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Staking Reward Forecast"
            description="Projected reward curve for your current staking balance across common conviction windows."
          >
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="grid gap-3 md:grid-cols-2">
                {rewardForecastData.map((point) => (
                  <div key={point.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{point.label} forecast</div>
                    <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(point.reward, 4)} {selectedToken}</div>
                    <div className="mt-2 text-sm text-slate-400">Projected portfolio value {formatNumber(point.value, 4)} {selectedToken}</div>
                  </div>
                ))}
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rewardForecastData}>
                    <defs>
                      <linearGradient id="stakeForecastGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.46} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#7F9AC0", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(8, 12, 28, 0.96)",
                        border: "1px solid rgba(59, 130, 246, 0.18)",
                        borderRadius: "16px",
                      }}
                    />
                    <Area type="monotone" dataKey="reward" stroke="#3B82F6" fill="url(#stakeForecastGradient)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Transaction History"
            description="Monitor deposits, stake events, claims, and withdrawals."
            action={
              <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
                <DollarSign className="h-4 w-4 text-cyan-300" />
                Filtered by {selectedToken}
              </div>
            }
          >
            {historyQuery.isLoading ? (
              <LoadingSkeleton lines={4} />
            ) : historyQuery.data && historyQuery.data.length > 0 ? (
              <DataTable columns={columns as never} data={historyQuery.data} />
            ) : (
              <EmptyState title="No staking history yet" description="Start a new position to populate your staking activity feed." />
            )}
          </SectionCard>
        </>
      ) : (
        <EmptyState title="Unable to load staking data" description="Check your API connection and try again." />
      )}

      <ModalDialog
        open={stakeModalOpen}
        onOpenChange={setStakeModalOpen}
        title="Stake Tokens"
        description="Select token, amount, and lock period to create a new staking position."
      >
        <form
          className="space-y-4"
          onSubmit={stakeForm.handleSubmit((values) => {
            stakeMutation.mutate(values);
          })}
        >
          <div className="space-y-2">
            <Label>Token</Label>
            <Select value={stakeForm.watch("tokenSymbol")} onValueChange={(value) => stakeForm.setValue("tokenSymbol", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_OPTIONS.map((token) => (
                  <SelectItem key={token.value} value={token.value}>
                    {token.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stakeAmount">Amount</Label>
            <Input id="stakeAmount" type="number" step="0.01" {...stakeForm.register("amount")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lockPeriod">Lock period</Label>
            <Input id="lockPeriod" type="number" {...stakeForm.register("durationDays")} />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setStakeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              type="button"
              disabled={staking.stakeMutation.isPending}
              onClick={stakeForm.handleSubmit((values) => {
                staking.stakeMutation.mutate(
                  {
                    amount: values.amount,
                    lockPeriod: values.durationDays,
                  },
                  {
                    onSuccess: (result) => {
                      setLastOnChainResult(result);
                      toast.success(result.message);
                    },
                    onError: (error) => toast.error(error instanceof Error ? error.message : "On-chain staking failed"),
                  },
                );
              })}
            >
              {staking.stakeMutation.isPending ? "Preparing..." : "On-chain Beta"}
            </Button>
            <ActionButton type="submit" disabled={stakeMutation.isPending}>
              {stakeMutation.isPending ? "Confirming..." : "Confirm Stake"}
            </ActionButton>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
