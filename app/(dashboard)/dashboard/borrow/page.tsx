"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Shield, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ActionButton } from "@/components/dashboard/action-button";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { useLending } from "@/hooks/useLending";
import { OnChainStatusCard } from "@/components/solana/on-chain-status-card";
import { TxSignatureCard } from "@/components/solana/tx-signature-card";
import { lendingApi } from "@/services/api";
import type { LendingMarket, TransactionRecord } from "@/types";
import type { OnChainActionResult } from "@/types";
import { formatCompactCurrency, formatNumber, formatPercent } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const actionSchema = z.object({
  token: z.string().min(1),
  amount: z.coerce.number().positive(),
});

const simulationSchema = z.object({
  asset: z.string().min(1),
  borrowAmount: z.coerce.number().nonnegative(),
  priceDropPercent: z.coerce.number().nonnegative().max(100),
});

function getRiskLabel(healthFactor: number) {
  if (healthFactor >= 2) return "safe";
  if (healthFactor >= 1.5) return "moderate";
  if (healthFactor >= 1.1) return "risky";
  return "danger";
}

export default function BorrowPage() {
  const queryClient = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState("SOL");
  const [lastOnChainResult, setLastOnChainResult] = useState<OnChainActionResult | null>(null);
  const lending = useLending();
  const onChainMarketQuery = useMemo(
    () => ({
      data: lending.marketsQuery.data
        ? {
            program: lending.marketsQuery.data.program,
            market: lending.marketsQuery.data.markets[0] || null,
          }
        : undefined,
      isLoading: lending.marketsQuery.isLoading,
    }),
    [lending.marketsQuery.data, lending.marketsQuery.isLoading],
  );

  const marketsQuery = useQuery({
    queryKey: ["lending", "markets"],
    queryFn: lendingApi.markets,
  });
  const positionQuery = useQuery({
    queryKey: ["lending", "position"],
    queryFn: lendingApi.position,
  });
  const historyQuery = useQuery({
    queryKey: ["lending", "history"],
    queryFn: lendingApi.history,
  });

  const actionForm = useForm<z.infer<typeof actionSchema>>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      token: selectedAsset,
      amount: 100,
    },
  });

  const simulationForm = useForm<z.infer<typeof simulationSchema>>({
    resolver: zodResolver(simulationSchema),
    defaultValues: {
      asset: selectedAsset,
      borrowAmount: 500,
      priceDropPercent: 15,
    },
  });

  const supplyMutation = useMutation({
    mutationFn: lendingApi.supply,
    onSuccess: () => {
      toast.success("Supply completed");
      queryClient.invalidateQueries({ queryKey: ["lending"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Request failed"),
  });
  const withdrawMutation = useMutation({
    mutationFn: lendingApi.withdraw,
    onSuccess: () => {
      toast.success("Withdraw completed");
      queryClient.invalidateQueries({ queryKey: ["lending"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Request failed"),
  });
  const borrowMutation = useMutation({
    mutationFn: lendingApi.borrow,
    onSuccess: () => {
      toast.success("Borrow completed");
      queryClient.invalidateQueries({ queryKey: ["lending"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Request failed"),
  });
  const repayMutation = useMutation({
    mutationFn: lendingApi.repay,
    onSuccess: () => {
      toast.success("Repay completed");
      queryClient.invalidateQueries({ queryKey: ["lending"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Request failed"),
  });
  const simulationMutation = useMutation({
    mutationFn: lendingApi.simulate,
  });
  const markets = useMemo(() => marketsQuery.data ?? [], [marketsQuery.data]);
  const selectedMarket = markets.find((market) => market.token === selectedAsset) || markets[0];
  const position = positionQuery.data;
  const selectedOnChainMarket = onChainMarketQuery.data?.market || null;

  useEffect(() => {
    if (selectedMarket) {
      actionForm.setValue("token", selectedMarket.token);
      simulationForm.setValue("asset", selectedMarket.token);
    }
  }, [actionForm, selectedMarket, simulationForm]);

  const stats = useMemo(() => {
    const totalSupplied = markets.reduce((sum, market) => sum + market.totalSupplied, 0);
    const totalBorrowed = markets.reduce((sum, market) => sum + market.totalBorrowed, 0);
    const utilization = markets.length ? markets.reduce((sum, market) => sum + market.utilization, 0) / markets.length : 0;
    const borrowApr = selectedMarket?.borrowApr || 0;
    const supplyApr = selectedMarket?.supplyApr || 0;
    return [
      { title: "Total Supplied", value: totalSupplied, change: 9.4, prefix: "$", chartData: markets.map((market) => ({ value: market.totalSupplied })) },
      { title: "Total Borrowed", value: totalBorrowed, change: 7.6, prefix: "$", chartData: markets.map((market) => ({ value: market.totalBorrowed })) },
      { title: "Utilization Rate", value: utilization, change: 1.8, suffix: "%", chartData: markets.map((market) => ({ value: market.utilization })) },
      { title: "Borrow APR", value: borrowApr, change: 0.9, suffix: "%", chartData: markets.map((market) => ({ value: market.borrowApr })) },
      { title: "Supply APR", value: supplyApr, change: 0.6, suffix: "%", chartData: markets.map((market) => ({ value: market.supplyApr })) },
    ];
  }, [markets, selectedMarket]);

  const columns = useMemo(
    () => [
      {
        header: "Asset",
        accessorKey: "token",
        cell: ({ row }: { row: { original: LendingMarket } }) => (
          <div>
            <div className="font-medium text-white">{row.original.token}</div>
            <div className="text-xs text-slate-500">Balance {formatNumber(row.original.walletBalance)}</div>
          </div>
        ),
      },
      { header: "Supply APR", accessorKey: "supplyApr", cell: ({ row }: { row: { original: LendingMarket } }) => formatPercent(row.original.supplyApr) },
      { header: "Borrow APR", accessorKey: "borrowApr", cell: ({ row }: { row: { original: LendingMarket } }) => formatPercent(row.original.borrowApr) },
      { header: "Utilization", accessorKey: "utilization", cell: ({ row }: { row: { original: LendingMarket } }) => formatPercent(row.original.utilization) },
      { header: "Collateral", accessorKey: "collateralFactor", cell: ({ row }: { row: { original: LendingMarket } }) => `${row.original.collateralFactor}%` },
      {
        header: "Actions",
        accessorKey: "actions",
        cell: ({ row }: { row: { original: LendingMarket } }) => (
          <div className="flex gap-2">
            {["Supply", "Withdraw", "Borrow", "Repay"].map((action) => (
              <Button
                key={action}
                size="sm"
                variant={action === "Borrow" ? "default" : "secondary"}
                onClick={() => {
                  setSelectedAsset(row.original.token);
                  actionForm.setValue("token", row.original.token);
                  simulationForm.setValue("asset", row.original.token);
                }}
              >
                {action}
              </Button>
            ))}
          </div>
        ),
      },
    ],
    [actionForm, simulationForm],
  );

  const activityColumns = useMemo(
    () => [
      {
        header: "Activity",
        accessorKey: "type",
        cell: ({ row }: { row: { original: TransactionRecord } }) => row.original.type,
      },
      { header: "Token", accessorKey: "token" },
      {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ row }: { row: { original: TransactionRecord } }) => formatNumber(row.original.amount),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }: { row: { original: TransactionRecord } }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Lend & Borrow" subtitle="Supply assets, borrow against collateral, and manage utilization" />

      {onChainMarketQuery.data ? (
        <OnChainStatusCard
          status={onChainMarketQuery.data.program}
          heading="On-chain lending market"
          body="Collateral, debt, and health checks are modeled for the Anchor lending program. This panel points to the canonical Solana market account once the devnet deployment is configured."
        />
      ) : null}

      {lastOnChainResult ? <TxSignatureCard result={lastOnChainResult} /> : null}

      {lending.positionQuery.data ? (
        <SectionCard
          title="On-chain lending position"
          description="Collateral, debt, and health factor fetched directly from your PDA-backed lending account."
        >
          {lending.wallet.connected ? (
            lending.positionQuery.data ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Collateral</div>
                  <div className="mt-3 text-xl font-semibold text-white">{formatNumber(lending.positionQuery.data.collateralAmount, 4)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Borrowed</div>
                  <div className="mt-3 text-xl font-semibold text-white">{formatNumber(lending.positionQuery.data.borrowedAmount, 4)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Interest Debt</div>
                  <div className="mt-3 text-xl font-semibold text-white">{formatNumber(lending.positionQuery.data.interestDebt, 4)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Health Factor</div>
                  <div className="mt-3 text-xl font-semibold text-white">{formatNumber(lending.positionQuery.data.healthFactor, 2)}</div>
                </div>
              </div>
            ) : (
              <EmptyState title="No on-chain lending position" description="Use the on-chain beta actions below to initialize your first lending PDA." />
            )
          ) : (
            <EmptyState title="Connect a wallet" description="Wallet connection is required to fetch on-chain lending position state." />
          )}
        </SectionCard>
      ) : null}

      {marketsQuery.isLoading || positionQuery.isLoading ? (
        <LoadingSkeleton lines={6} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => (
              <StatCard key={item.title} item={item} />
            ))}
          </div>

          <SectionCard title="Supported Assets" description="Supply or borrow from live lending markets.">
            {markets.length > 0 ? (
              <DataTable columns={columns as never} data={markets as never[]} />
            ) : (
              <EmptyState title="No markets found" description="Seed data is missing from the lending service." />
            )}
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard title="Supply & Borrow Panel" description="Act on the selected asset with guarded risk metrics.">
              {selectedMarket ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <form
                    className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-5"
                    onSubmit={actionForm.handleSubmit((values) => supplyMutation.mutate(values))}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Supply asset</div>
                        <div className="text-2xl font-semibold text-white">{selectedAsset}</div>
                      </div>
                      <WalletCards className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input type="number" step="0.01" {...actionForm.register("amount")} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Collateral value</div>
                        <div className="mt-3 text-xl font-semibold text-white">{formatCompactCurrency(position?.collateralValue || 0)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Borrow limit impact</div>
                        <div className="mt-3 text-xl font-semibold text-white">{formatCompactCurrency(position?.availableToBorrow || 0)}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          if (!selectedOnChainMarket) {
                            toast.error("No on-chain lending market found");
                            return;
                          }

                          lending.depositMutation.mutate(
                            { amount: actionForm.getValues("amount"), marketAddress: selectedOnChainMarket.address },
                            {
                              onSuccess: (result) => {
                                setLastOnChainResult(result);
                                toast.success(result.message);
                              },
                              onError: (error) => toast.error(error instanceof Error ? error.message : "On-chain deposit failed"),
                            },
                          );
                        }}
                        disabled={lending.depositMutation.isPending}
                      >
                        {lending.depositMutation.isPending ? "Preparing..." : "On-chain Beta"}
                      </Button>
                      <ActionButton type="submit" className="flex-1">
                        Supply
                      </ActionButton>
                      <Button type="button" variant="secondary" className="flex-1" onClick={actionForm.handleSubmit((values) => withdrawMutation.mutate(values))}>
                        Withdraw
                      </Button>
                    </div>
                  </form>

                  <form
                    className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-5"
                    onSubmit={actionForm.handleSubmit((values) => borrowMutation.mutate(values))}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Borrow asset</div>
                        <div className="text-2xl font-semibold text-white">{selectedAsset}</div>
                      </div>
                      <Shield className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input type="number" step="0.01" {...actionForm.register("amount")} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Health factor</div>
                        <div className="mt-3 text-xl font-semibold text-white">{formatNumber(position?.healthFactor || 0)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Liquidation risk</div>
                        <div className="mt-3 text-xl font-semibold text-white capitalize">{getRiskLabel(position?.healthFactor || 0)}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          if (!selectedOnChainMarket) {
                            toast.error("No on-chain lending market found");
                            return;
                          }

                          lending.borrowMutation.mutate(
                            { amount: actionForm.getValues("amount"), marketAddress: selectedOnChainMarket.address },
                            {
                              onSuccess: (result) => {
                                setLastOnChainResult(result);
                                toast.success(result.message);
                              },
                              onError: (error) => toast.error(error instanceof Error ? error.message : "On-chain borrow failed"),
                            },
                          );
                        }}
                        disabled={lending.borrowMutation.isPending}
                      >
                        {lending.borrowMutation.isPending ? "Preparing..." : "On-chain Beta"}
                      </Button>
                      <ActionButton type="submit" className="flex-1">
                        Borrow
                      </ActionButton>
                      <Button type="button" variant="secondary" className="flex-1" onClick={actionForm.handleSubmit((values) => repayMutation.mutate(values))}>
                        Repay
                      </Button>
                    </div>
                  </form>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Position Summary" description="Net protocol exposure and liquidation safety.">
              {position ? (
                <div className="space-y-4">
                  {[
                    ["Total supplied", formatCompactCurrency(position.collateralValue)],
                    ["Total borrowed", formatCompactCurrency(position.borrowValue)],
                    ["Available to borrow", formatCompactCurrency(position.availableToBorrow)],
                    ["Net APY", `${formatNumber(position.netApy)}%`],
                    ["Health factor", formatNumber(position.healthFactor)],
                    ["Collateral ratio", `${formatNumber(position.collateralRatio)}%`],
                    ["Liquidation threshold", formatCompactCurrency(position.liquidationThreshold)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4">
                      <div className="text-sm text-slate-400">{label}</div>
                      <div className="text-lg font-semibold text-white">{value}</div>
                    </div>
                  ))}

                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                      <AlertTriangle className="h-4 w-4 text-cyan-300" />
                      Risk Meter
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${
                          getRiskLabel(position.healthFactor) === "safe"
                            ? "w-[25%] bg-emerald-400"
                            : getRiskLabel(position.healthFactor) === "moderate"
                              ? "w-[55%] bg-amber-400"
                              : getRiskLabel(position.healthFactor) === "risky"
                                ? "w-[78%] bg-orange-400"
                                : "w-full bg-rose-400"
                        }`}
                      />
                    </div>
                    <div className="mt-3 text-sm text-slate-400 capitalize">{getRiskLabel(position.healthFactor)}</div>
                  </div>
                </div>
              ) : null}
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard title="Borrow Liquidation Simulator" description="Model downside, liquidation pressure, and collateral resilience before increasing debt.">
              <form
                className="space-y-4"
                onSubmit={simulationForm.handleSubmit((values) => simulationMutation.mutate(values))}
              >
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Input {...simulationForm.register("asset")} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Borrow amount</Label>
                    <Input type="number" {...simulationForm.register("borrowAmount")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price drop %</Label>
                    <Input type="number" {...simulationForm.register("priceDropPercent")} />
                  </div>
                </div>
                <ActionButton type="submit">Run simulation</ActionButton>
              </form>

              {simulationMutation.data ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Projected health factor</div>
                    <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(simulationMutation.data.projectedHealthFactor)}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Liquidation risk</div>
                    <div className="mt-3 text-2xl font-semibold capitalize text-white">{simulationMutation.data.liquidationRisk}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Collateral after shock</div>
                    <div className="mt-3 text-2xl font-semibold text-white">{formatCompactCurrency(simulationMutation.data.projectedCollateralValue)}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Safety buffer</div>
                    <div className="mt-3 text-2xl font-semibold text-white">
                      {formatCompactCurrency(simulationMutation.data.projectedCollateralValue - simulationMutation.data.projectedBorrowValue)}
                    </div>
                  </div>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Activity Table" description="Supply, withdraw, borrow, repay, and risk events.">
              {historyQuery.isLoading ? (
                <LoadingSkeleton lines={4} />
              ) : historyQuery.data && historyQuery.data.length > 0 ? (
                <DataTable columns={activityColumns as never} data={historyQuery.data as never[]} />
              ) : (
                <EmptyState title="No lending activity" description="Use the panel above to create your first supply or borrow action." />
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
