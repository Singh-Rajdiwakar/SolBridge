"use client";

import type { SharedPortfolioSnapshotRecord } from "@/types";
import { formatCompactCurrency, formatDate } from "@/utils/format";

export function SharedPortfolioSnapshotCard({ snapshot }: { snapshot: SharedPortfolioSnapshotRecord }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{snapshot.timeframe} Snapshot</div>
          <div className="mt-2 text-lg font-semibold text-white">{snapshot.title}</div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          {snapshot.visibility}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-slate-950/60 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Portfolio Value</div>
          <div className="mt-2 text-xl font-semibold text-white">
            {snapshot.summaryData?.portfolioValue ? formatCompactCurrency(snapshot.summaryData.portfolioValue) : "--"}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-slate-950/60 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">PnL</div>
          <div className="mt-2 text-xl font-semibold text-white">
            {snapshot.summaryData?.pnl ? formatCompactCurrency(snapshot.summaryData.pnl) : "--"}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(snapshot.summaryData?.topAssets || []).slice(0, 3).map((asset) => (
          <div key={`${snapshot._id}-${asset.symbol}`} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
            {asset.symbol} {(asset.allocationPercent || 0).toFixed(1)}%
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-slate-500">Shared {formatDate(snapshot.createdAt)}</div>
    </div>
  );
}
