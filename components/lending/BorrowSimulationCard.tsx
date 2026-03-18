"use client";

import { useEffect, useState } from "react";

import { GlassCard, GradientButton, SectionHeader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BorrowSimulationInput, BorrowSimulationResult, LendingPosition } from "@/types";
import { formatCompactCurrency, formatNumber } from "@/utils/format";

export function BorrowSimulationCard({
  position,
  onSimulate,
  result,
}: {
  position: LendingPosition;
  onSimulate: (data: BorrowSimulationInput) => void;
  result?: BorrowSimulationResult;
}) {
  const defaultAsset = position.suppliedAssets[0]?.token || "SOL";
  const [asset, setAsset] = useState(defaultAsset);
  const [borrowAmount, setBorrowAmount] = useState(500);
  const [priceDropPercent, setPriceDropPercent] = useState(15);

  useEffect(() => {
    setAsset(defaultAsset);
  }, [defaultAsset]);

  return (
    <GlassCard>
      <SectionHeader
        title="Borrow Simulation Tool"
        subtitle="Preview health factor changes before increasing debt or after a collateral price drop."
      />

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSimulate({
            asset,
            borrowAmount,
            priceDropPercent,
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="borrow-simulation-asset">Asset</Label>
          <Input id="borrow-simulation-asset" value={asset} onChange={(event) => setAsset(event.target.value)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="borrow-simulation-amount">Borrow amount</Label>
            <Input
              id="borrow-simulation-amount"
              type="number"
              min="0"
              step="0.01"
              value={borrowAmount}
              onChange={(event) => setBorrowAmount(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="borrow-simulation-drop">Price drop %</Label>
            <Input
              id="borrow-simulation-drop"
              type="number"
              min="0"
              max="100"
              value={priceDropPercent}
              onChange={(event) => setPriceDropPercent(Number(event.target.value))}
            />
          </div>
        </div>

        <GradientButton type="submit">Run Simulation</GradientButton>
      </form>

      {result ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Projected health factor</div>
            <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(result.projectedHealthFactor)}</div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Projected collateral value</div>
            <div className="mt-3 text-2xl font-semibold text-white">
              {formatCompactCurrency(result.projectedCollateralValue)}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Projected debt value</div>
            <div className="mt-3 text-2xl font-semibold text-white">{formatCompactCurrency(result.projectedBorrowValue)}</div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Liquidation risk</div>
            <div className="mt-3 text-2xl font-semibold capitalize text-white">{result.liquidationRisk}</div>
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
