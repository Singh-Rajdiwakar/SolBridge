"use client";

import { useEffect, useState } from "react";

import { EmptyState, GlassCard, GradientButton, SectionHeader, StatusBadge, TokenBadge } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LendingActionInput, LendingMarket, LendingPosition, LendingSimulationResult } from "@/types";
import { formatCompactCurrency, formatNumber } from "@/utils/format";

function toTitleCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function getRiskLabel(healthFactor: number) {
  if (healthFactor >= 2) return "safe";
  if (healthFactor >= 1.5) return "moderate";
  if (healthFactor >= 1.1) return "risky";
  return "danger";
}

export function SupplyBorrowPanel({
  mode,
  selectedAsset,
  position,
  onSubmit,
  simulation,
}: {
  mode: "supply" | "borrow" | "withdraw" | "repay";
  selectedAsset: LendingMarket | null;
  position: LendingPosition;
  onSubmit: (data: LendingActionInput) => void;
  simulation?: LendingSimulationResult;
}) {
  const [amount, setAmount] = useState(100);

  useEffect(() => {
    setAmount(100);
  }, [mode, selectedAsset?._id]);

  if (!selectedAsset) {
    return (
      <GlassCard>
        <SectionHeader
          title="Supply & Borrow Panel"
          subtitle="Select an asset from the market table to stage an action."
        />
        <EmptyState title="No asset selected" description="Pick a supported market to preview health, collateral, and risk impact." />
      </GlassCard>
    );
  }

  const submit = () =>
    onSubmit({
      token: selectedAsset.token,
      amount,
    });

  return (
    <GlassCard>
      <SectionHeader
        title="Supply & Borrow Panel"
        subtitle="Interactive action card for collateral, debt, and utilization changes."
        action={<StatusBadge status={mode} />}
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
          <TokenBadge symbol={selectedAsset.token} />

          <div className="space-y-2">
            <Label htmlFor="lending-action-amount">Amount</Label>
            <Input
              id="lending-action-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Collateral value</div>
              <div className="mt-3 text-xl font-semibold text-white">{formatCompactCurrency(position.collateralValue)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Borrow limit impact</div>
              <div className="mt-3 text-xl font-semibold text-white">{formatCompactCurrency(position.availableToBorrow)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Health factor</div>
              <div className="mt-3 text-xl font-semibold text-white">{formatNumber(position.healthFactor)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Liquidation risk</div>
              <div className="mt-3 text-xl font-semibold capitalize text-white">{getRiskLabel(position.healthFactor)}</div>
            </div>
          </div>

          <GradientButton className="w-full" onClick={submit}>
            {toTitleCase(mode)} {selectedAsset.token}
          </GradientButton>
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-slate-400">Selected market</div>
          <div className="text-2xl font-semibold text-white">{selectedAsset.token}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Supply APR</div>
              <div className="mt-3 text-xl font-semibold text-white">{formatNumber(selectedAsset.supplyApr)}%</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Borrow APR</div>
              <div className="mt-3 text-xl font-semibold text-white">{formatNumber(selectedAsset.borrowApr)}%</div>
            </div>
          </div>

          {simulation ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-cyan-400/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Projected health factor</div>
                <div className="mt-3 text-xl font-semibold text-white">{formatNumber(simulation.projectedHealthFactor)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-cyan-400/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Projected debt value</div>
                <div className="mt-3 text-xl font-semibold text-white">
                  {formatCompactCurrency(simulation.projectedBorrowValue)}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}
