"use client";

import { DatabaseZap, Download, ShieldCheck } from "lucide-react";

import { FilterTabs } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { TreasuryOverviewResponse, TreasuryRange } from "@/types";
import { formatRelativeTime } from "@/utils/format";

export function TreasuryHeader({
  overview,
  range,
  onRangeChange,
}: {
  overview?: TreasuryOverviewResponse;
  range: TreasuryRange;
  onRangeChange: (range: TreasuryRange) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
            <DatabaseZap className="h-3.5 w-3.5" />
            DAO Treasury Dashboard
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Treasury transparency and governance-linked reserve management</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              On-chain treasury balances, proposal-linked spending, reserve runway, and concentration monitoring grouped into one protocol finance surface.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs
            items={[
              { label: "7D", value: "7D" },
              { label: "30D", value: "30D" },
              { label: "90D", value: "90D" },
              { label: "1Y", value: "1Y" },
              { label: "ALL", value: "ALL" },
            ]}
            active={range}
            onChange={(value) => onRangeChange(value as TreasuryRange)}
          />
          <Button variant="secondary">
            <ShieldCheck className="h-4 w-4" />
            {overview?.treasuryHealthLabel || "Treasury Live"}
          </Button>
          <Button variant="secondary" disabled>
            <Download className="h-4 w-4" />
            Export Soon
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1">
          {overview?.treasuryName || "DAO Treasury"}
        </span>
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1">
          {overview?.sourceOfTruth || "On-chain + cache"}
        </span>
        {overview?.latestRecordedAt ? (
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1">
            Freshness {formatRelativeTime(overview.latestRecordedAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
