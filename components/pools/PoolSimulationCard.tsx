"use client";

import { GlassCard, GradientButton, SectionHeader, StatusBadge } from "@/components/shared";
import type { Pool, PoolSimulationInput, PoolSimulationResult } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercent } from "@/utils/format";

export function PoolSimulationCard({
  selectedPool,
  onSimulate,
  result,
  onAddLiquidity,
  onRemoveLiquidity,
  amountA,
  amountB,
  onAmountAChange,
  onAmountBChange,
}: {
  selectedPool: Pool | null;
  onSimulate: (data: PoolSimulationInput) => void;
  result?: PoolSimulationResult;
  onAddLiquidity: () => void;
  onRemoveLiquidity: () => void;
  amountA: number;
  amountB: number;
  onAmountAChange: (value: number) => void;
  onAmountBChange: (value: number) => void;
}) {
  if (!selectedPool) {
    return (
      <GlassCard>
        <SectionHeader title="Pool Detail / Simulation" subtitle="Select a pool to model your position." />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader title="Pool Detail / Simulation" subtitle="Right panel for calculating LP token output and share." />
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Selected pair</div>
            <div className="mt-2 text-2xl font-semibold text-white">{selectedPool.pair}</div>
          </div>
          <StatusBadge status="active" />
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{selectedPool.tokenA} amount</Label>
            <Input type="number" value={amountA} onChange={(event) => onAmountAChange(Number(event.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>{selectedPool.tokenB} amount</Label>
            <Input type="number" value={amountB} onChange={(event) => onAmountBChange(Number(event.target.value))} />
          </div>
        </div>
        <Button type="button" variant="secondary" className="w-full" onClick={() => onSimulate({ poolId: selectedPool._id, amountA, amountB })}>
          Simulate Position
        </Button>
        {result ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Expected LP tokens</div>
              <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(result.expectedLpTokens)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Slippage preview</div>
              <div className="mt-3 text-2xl font-semibold text-white">{formatPercent(result.slippagePreview)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Price impact</div>
              <div className="mt-3 text-2xl font-semibold text-white">{formatPercent(result.priceImpact || 0)}</div>
            </div>
          </div>
        ) : null}
        <div className="flex gap-3">
          <GradientButton className="flex-1" onClick={onAddLiquidity}>
            Add Liquidity
          </GradientButton>
          <Button type="button" variant="secondary" className="flex-1" onClick={onRemoveLiquidity}>
            Remove Liquidity
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
