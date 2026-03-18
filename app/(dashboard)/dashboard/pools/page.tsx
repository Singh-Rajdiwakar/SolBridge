"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Droplets } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { SearchInput } from "@/components/dashboard/search-input";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { useLiquidity } from "@/hooks/useLiquidity";
import { OnChainStatusCard } from "@/components/solana/on-chain-status-card";
import { TxSignatureCard } from "@/components/solana/tx-signature-card";
import { poolsApi } from "@/services/api";
import { useUiStore } from "@/store/ui-store";
import type { LiquidityPosition, OnChainActionResult, Pool } from "@/types";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const addLiquiditySchema = z.object({
  poolId: z.string().min(1),
  amountA: z.coerce.number().positive(),
  amountB: z.coerce.number().positive(),
});

export default function PoolsPage() {
  const queryClient = useQueryClient();
  const activePoolId = useUiStore((state) => state.activePoolId);
  const setActivePoolId = useUiStore((state) => state.setActivePoolId);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("totalLiquidity");
  const [liquidityModalOpen, setLiquidityModalOpen] = useState(false);
  const [priceMovePercent, setPriceMovePercent] = useState(20);
  const [lastOnChainResult, setLastOnChainResult] = useState<OnChainActionResult | null>(null);
  const liquidity = useLiquidity();
  const onChainPoolsQuery = liquidity.poolsQuery;

  const poolsQuery = useQuery({
    queryKey: ["pools", search, sortBy],
    queryFn: () => poolsApi.list({ search, sortBy }),
  });
  const positionsQuery = useQuery({
    queryKey: ["pools", "positions"],
    queryFn: poolsApi.positions,
  });
  const feeHistoryQuery = useQuery({
    queryKey: ["pools", "fee-history"],
    queryFn: poolsApi.feeHistory,
  });
  const activePoolQuery = useQuery({
    queryKey: ["pools", "detail", activePoolId],
    queryFn: () => poolsApi.detail(activePoolId!),
    enabled: Boolean(activePoolId),
  });

  const addForm = useForm<z.infer<typeof addLiquiditySchema>>({
    resolver: zodResolver(addLiquiditySchema),
    defaultValues: {
      poolId: activePoolId || "",
      amountA: 5,
      amountB: 750,
    },
  });

  const simulationMutation = useMutation({
    mutationFn: poolsApi.simulate,
  });

  const addLiquidityMutation = useMutation({
    mutationFn: poolsApi.addLiquidity,
    onSuccess: () => {
      toast.success("Liquidity added");
      setLiquidityModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pools"] });
    },
  });

  const pools = useMemo(() => poolsQuery.data ?? [], [poolsQuery.data]);
  const selectedPool = activePoolQuery.data || pools[0];
  const selectedOnChainPool = onChainPoolsQuery.data?.pools[0] || null;
  const impermanentLossEstimate = useMemo(() => {
    const ratio = 1 + Math.abs(priceMovePercent) / 100;
    const il = (2 * Math.sqrt(ratio)) / (1 + ratio) - 1;
    const deployedCapital = (addForm.getValues("amountA") || 0) + (addForm.getValues("amountB") || 0);
    return {
      percent: Math.abs(il * 100),
      usdImpact: Math.abs(il) * deployedCapital,
    };
  }, [addForm, priceMovePercent]);

  useEffect(() => {
    if (selectedPool) {
      addForm.setValue("poolId", selectedPool._id);
      if (!activePoolId) {
        setActivePoolId(selectedPool._id);
      }
    }
  }, [activePoolId, addForm, selectedPool, setActivePoolId]);

  const stats = useMemo(() => {
    const totalLiquidity = pools.reduce((sum, pool) => sum + pool.totalLiquidity, 0);
    const totalVolume = pools.reduce((sum, pool) => sum + pool.volume24h, 0);
    const feesEarned = (positionsQuery.data || []).reduce((sum, position) => sum + position.feesEarned, 0);
    const avgGrowth = pools.length ? pools.reduce((sum, pool) => sum + pool.apr, 0) / pools.length : 0;

    return [
      { title: "Total Liquidity", value: totalLiquidity, change: 11.2, prefix: "$", chartData: pools.map((pool) => ({ value: pool.totalLiquidity })) },
      { title: "24h Volume", value: totalVolume, change: 6.9, prefix: "$", chartData: pools.map((pool) => ({ value: pool.volume24h })) },
      { title: "Pool Fees Earned", value: feesEarned, change: 4.8, prefix: "$", chartData: (positionsQuery.data || []).map((position) => ({ value: position.feesEarned })) },
      { title: "TVL Growth", value: avgGrowth, change: 2.7, suffix: "%", chartData: pools.map((pool) => ({ value: pool.apr })) },
    ];
  }, [pools, positionsQuery.data]);

  const poolColumns = useMemo(
    () => [
      {
        header: "Pair",
        accessorKey: "pair",
        cell: ({ row }: { row: { original: Pool } }) => (
          <div>
            <div className="font-medium text-white">{row.original.pair}</div>
            <div className="text-xs text-slate-500">
              {row.original.tokenA} / {row.original.tokenB}
            </div>
          </div>
        ),
      },
      {
        header: "Liquidity",
        accessorKey: "totalLiquidity",
        cell: ({ row }: { row: { original: Pool } }) => formatCompactCurrency(row.original.totalLiquidity),
      },
      {
        header: "APR",
        accessorKey: "apr",
        cell: ({ row }: { row: { original: Pool } }) => formatPercent(row.original.apr),
      },
      {
        header: "Volume 24h",
        accessorKey: "volume24h",
        cell: ({ row }: { row: { original: Pool } }) => formatCompactCurrency(row.original.volume24h),
      },
      {
        header: "Fee",
        accessorKey: "feePercent",
        cell: ({ row }: { row: { original: Pool } }) => `${row.original.feePercent}%`,
      },
      {
        header: "Your Share",
        accessorKey: "yourShare",
        cell: ({ row }: { row: { original: Pool } }) => `${formatNumber(row.original.yourShare, 3)}%`,
      },
      {
        header: "Action",
        accessorKey: "action",
        cell: ({ row }: { row: { original: Pool } }) => (
          <Button
            size="sm"
            onClick={() => {
              setActivePoolId(row.original._id);
              addForm.setValue("poolId", row.original._id);
              setLiquidityModalOpen(true);
            }}
          >
            Manage
          </Button>
        ),
      },
    ],
    [addForm, setActivePoolId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liquidity Pools"
        subtitle="Provide liquidity and earn trading fees"
        action={
          <div className="glass-panel flex items-center gap-3 px-4 py-3">
            <Droplets className="h-4 w-4 text-cyan-300" />
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Wallet summary</div>
              <div className="text-lg font-semibold text-white">
                {positionsQuery.data ? formatCompactCurrency(positionsQuery.data.reduce((sum, p) => sum + p.feesEarned, 0) * 12) : "--"}
              </div>
            </div>
          </div>
        }
      />

      {onChainPoolsQuery.data ? (
        <OnChainStatusCard
          status={onChainPoolsQuery.data.program}
          heading="On-chain pool reserves"
          body="Pool vaults, LP supply, and swap fees are wired for the Anchor liquidity program. Program and pool account explorer links live here so protocol state can be verified independently."
        />
      ) : null}

      {lastOnChainResult ? <TxSignatureCard result={lastOnChainResult} /> : null}

      {onChainPoolsQuery.data?.pools?.length ? (
        <SectionCard
          title="On-chain pools"
          description="Live PDA-backed pool state fetched from the Anchor liquidity program."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {onChainPoolsQuery.data.pools.map((pool) => (
              <div key={pool.address} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{pool.tokenA} / {pool.tokenB}</div>
                    <div className="mt-1 text-xs text-slate-500">{pool.address}</div>
                  </div>
                  <StatusBadge status={pool.paused ? "paused" : "active"} />
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between"><span>Fee</span><span>{formatNumber(pool.feeRateBps / 100, 2)}%</span></div>
                  <div className="flex justify-between"><span>Total Liquidity</span><span>{formatNumber(pool.totalLiquidity, 4)}</span></div>
                  <div className="flex justify-between"><span>Reserve A</span><span>{formatNumber(pool.reserveA || 0, 4)}</span></div>
                  <div className="flex justify-between"><span>Reserve B</span><span>{formatNumber(pool.reserveB || 0, 4)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {poolsQuery.isLoading ? (
        <LoadingSkeleton lines={6} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <StatCard key={item.title} item={item} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard
              title="Pools Table"
              description="Search, sort, and inspect active AMM markets."
              action={
                <div className="flex flex-col gap-3 md:flex-row">
                  <SearchInput value={search} onChange={setSearch} placeholder="Search pools" />
                  <FilterBar
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      { label: "Liquidity", value: "totalLiquidity" },
                      { label: "APR", value: "apr" },
                      { label: "Volume", value: "volume24h" },
                    ]}
                  />
                </div>
              }
            >
              {pools.length > 0 ? (
                <DataTable columns={poolColumns as never} data={pools as never[]} />
              ) : (
                <EmptyState title="No pools found" description="Try adjusting your search or filters." />
              )}
            </SectionCard>

            <SectionCard title="Pool Detail / Simulation" description="Model your contribution before sending liquidity.">
              {selectedPool ? (
                <>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Selected pair</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{selectedPool.pair}</div>
                      </div>
                      <StatusBadge status="active" />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Share of pool</div>
                        <div className="mt-3 text-xl font-semibold text-white">{formatNumber(selectedPool.yourShare, 3)}%</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Estimated APR</div>
                        <div className="mt-3 text-xl font-semibold text-white">{formatPercent(selectedPool.apr)}</div>
                      </div>
                    </div>
                  </div>

                  <form
                    className="mt-5 space-y-4"
                    onSubmit={addForm.handleSubmit((values) => {
                      addLiquidityMutation.mutate(values);
                    })}
                  >
                    <input type="hidden" {...addForm.register("poolId")} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{selectedPool.tokenA} amount</Label>
                        <Input type="number" step="0.01" {...addForm.register("amountA")} />
                      </div>
                      <div className="space-y-2">
                        <Label>{selectedPool.tokenB} amount</Label>
                        <Input type="number" step="0.01" {...addForm.register("amountB")} />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() =>
                        simulationMutation.mutate({
                          poolId: selectedPool._id,
                          amountA: addForm.getValues("amountA"),
                          amountB: addForm.getValues("amountB"),
                        })
                      }
                    >
                      Simulate Position
                    </Button>

                    {simulationMutation.data ? (
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Expected LP tokens</div>
                          <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(simulationMutation.data.expectedLpTokens)}</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Slippage preview</div>
                          <div className="mt-3 text-2xl font-semibold text-white">{formatPercent(simulationMutation.data.slippagePreview)}</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Price impact</div>
                          <div className="mt-3 text-2xl font-semibold text-white">
                            {formatPercent(simulationMutation.data.priceImpact || 0)}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={addForm.handleSubmit((values) => {
                          if (!selectedOnChainPool) {
                            toast.error("No on-chain pool found");
                            return;
                          }

                          liquidity.addLiquidityMutation.mutate(
                            {
                              poolAddress: selectedOnChainPool.address,
                              amountA: values.amountA,
                              amountB: values.amountB,
                              minLpOut: simulationMutation.data?.expectedLpTokens || 0,
                            },
                            {
                              onSuccess: (result) => {
                                setLastOnChainResult(result);
                                toast.success(result.message);
                              },
                              onError: (error) => toast.error(error instanceof Error ? error.message : "On-chain liquidity add failed"),
                            },
                          );
                        })}
                        disabled={liquidity.addLiquidityMutation.isPending || !selectedOnChainPool}
                      >
                        {liquidity.addLiquidityMutation.isPending ? "Preparing..." : "On-chain Beta"}
                      </Button>
                      <ActionButton type="submit" className="flex-1">
                        Add Liquidity
                      </ActionButton>
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          if (!selectedOnChainPool) {
                            toast.error("No on-chain pool found");
                            return;
                          }

                          liquidity.removeLiquidityMutation.mutate(
                            { poolAddress: selectedOnChainPool.address, lpAmount: 1 },
                            {
                              onSuccess: (result) => {
                                setLastOnChainResult(result);
                                toast.success(result.message);
                              },
                              onError: (error) => toast.error(error instanceof Error ? error.message : "On-chain remove failed"),
                            },
                          );
                        }}
                      >
                        Remove Liquidity
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <EmptyState title="Select a pool" description="Choose a liquidity market from the table to simulate your contribution." />
              )}
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard title="My Active Positions" description="Track deposited capital, LP balances, and fee growth.">
              {positionsQuery.isLoading ? (
                <LoadingSkeleton lines={4} />
              ) : positionsQuery.data && positionsQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {positionsQuery.data.map((position: LiquidityPosition) => (
                    <div key={position._id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">{position.pair}</div>
                          <div className="text-sm text-slate-400">
                            Deposited {formatNumber(position.amountA)} / {formatNumber(position.amountB)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">{formatNumber(position.lpTokens)} LP</div>
                          <div className="text-sm text-cyan-200">Fees {formatCurrency(position.feesEarned)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No LP positions" description="Use the simulation panel to add liquidity to your first pool." />
              )}
            </SectionCard>

            <SectionCard title="Fee Earnings Chart" description="Historical fee earnings across your active positions.">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={feeHistoryQuery.data || []}>
                    <defs>
                      <linearGradient id="feeGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#1AB8FF" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#1AB8FF" stopOpacity={0} />
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
                    <Area type="monotone" dataKey="value" stroke="#1AB8FF" fill="url(#feeGradient)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Impermanent Loss Calculator"
            description="Stress-test expected LP downside under token divergence before committing more liquidity."
          >
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <div className="space-y-2">
                  <Label>Expected price move</Label>
                  <Input
                    type="number"
                    step="1"
                    value={priceMovePercent}
                    onChange={(event) => setPriceMovePercent(Number(event.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated deployed capital</Label>
                  <Input
                    type="number"
                    value={(addForm.getValues("amountA") || 0) + (addForm.getValues("amountB") || 0)}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Pool</div>
                  <div className="mt-3 text-xl font-semibold text-white">{selectedPool?.pair || "--"}</div>
                  <div className="mt-2 text-sm text-slate-400">LP divergence model based on a simplified constant-product curve.</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">IL estimate</div>
                  <div className="mt-3 text-xl font-semibold text-amber-200">{formatPercent(impermanentLossEstimate.percent)}</div>
                  <div className="mt-2 text-sm text-slate-400">Loss versus holding both assets outright.</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Estimated impact</div>
                  <div className="mt-3 text-xl font-semibold text-white">{formatCurrency(impermanentLossEstimate.usdImpact)}</div>
                  <div className="mt-2 text-sm text-slate-400">Use this beside fees earned and APR before sizing up.</div>
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      )}

      <ModalDialog open={liquidityModalOpen} onOpenChange={setLiquidityModalOpen} title="Add Liquidity" description="Provide token A and token B amounts to receive LP tokens.">
        <form
          className="space-y-4"
          onSubmit={addForm.handleSubmit((values) => {
            addLiquidityMutation.mutate(values);
          })}
        >
          <div className="space-y-2">
            <Label>Pool ID</Label>
            <Input {...addForm.register("poolId")} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount A</Label>
              <Input type="number" step="0.01" {...addForm.register("amountA")} />
            </div>
            <div className="space-y-2">
              <Label>Amount B</Label>
              <Input type="number" step="0.01" {...addForm.register("amountB")} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setLiquidityModalOpen(false)}>
              Cancel
            </Button>
            <ActionButton type="submit" disabled={addLiquidityMutation.isPending}>
              Confirm transaction
            </ActionButton>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
