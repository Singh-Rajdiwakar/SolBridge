"use client";

import { TimerReset } from "lucide-react";

import { FilterTabs, GlassCard } from "@/components/shared";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import type { NetworkMonitorRange, NetworkOverviewResponse } from "@/types";
import { formatRelativeTime } from "@/utils/format";

export function NetworkMonitorHeader({
  overview,
  range,
  autoRefresh,
  onRangeChange,
  onAutoRefreshChange,
  onRefresh,
}: {
  overview?: NetworkOverviewResponse;
  range: NetworkMonitorRange;
  autoRefresh: boolean;
  onRangeChange: (value: NetworkMonitorRange) => void;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Network Operations Monitor"
        subtitle="Real-time TPS, block-time stability, RPC latency, network fees, validator health, and protocol impact in one infrastructure-grade Solana monitoring surface."
        badge={overview?.environment || "Devnet"}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <FilterTabs
              items={[
                { label: "1H", value: "1H" },
                { label: "24H", value: "24H" },
                { label: "7D", value: "7D" },
                { label: "30D", value: "30D" },
              ]}
              active={range}
              onChange={(value) => onRangeChange(value as NetworkMonitorRange)}
            />
            <Button variant="secondary" onClick={() => onAutoRefreshChange(!autoRefresh)}>
              <TimerReset className="h-4 w-4" />
              {autoRefresh ? "Pause Auto Refresh" : "Resume Auto Refresh"}
            </Button>
            <Button onClick={onRefresh}>Refresh Metrics</Button>
          </div>
        }
      />

      <GlassCard className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#c9c4bb]">
          <span>{overview?.endpointLabel || "Configured RPC endpoint"}</span>
          <span className="rounded-full border border-[rgba(224,185,75,0.14)] bg-[rgba(224,185,75,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#f3d57c]">
            Last updated {overview?.lastUpdated ? formatRelativeTime(overview.lastUpdated) : "pending"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#c9c4bb]">
            RPC health mixed live + cached
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
