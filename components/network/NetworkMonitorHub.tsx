"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { BlockTimeChartCard } from "@/components/network/BlockTimeChartCard";
import { EndpointComparisonTable } from "@/components/network/EndpointComparisonTable";
import { NetworkFeesCard } from "@/components/network/NetworkFeesCard";
import { NetworkHealthScoreCard } from "@/components/network/NetworkHealthScoreCard";
import { NetworkMonitorHeader } from "@/components/network/NetworkMonitorHeader";
import { NetworkOverviewCards } from "@/components/network/NetworkOverviewCards";
import { NetworkStatusFeed } from "@/components/network/NetworkStatusFeed";
import { ProtocolImpactPanel } from "@/components/network/ProtocolImpactPanel";
import { RPCLatencyCard } from "@/components/network/RPCLatencyCard";
import { ThroughputChartCard } from "@/components/network/ThroughputChartCard";
import { TPSChartCard } from "@/components/network/TPSChartCard";
import { ValidatorCountCard } from "@/components/network/ValidatorCountCard";
import { GlassCard } from "@/components/shared";
import { useNetworkMonitor } from "@/hooks/useNetworkMonitor";
import type { NetworkMonitorRange } from "@/types";
import { Button } from "@/components/ui/button";

export function NetworkMonitorHub() {
  const [range, setRange] = useState<NetworkMonitorRange>("24H");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const monitor = useNetworkMonitor({ range, autoRefresh, eventsLimit: 12 });

  const isLoading = useMemo(
    () =>
      monitor.overviewQuery.isLoading ||
      monitor.tpsQuery.isLoading ||
      monitor.blockTimeQuery.isLoading ||
      monitor.throughputQuery.isLoading ||
      monitor.feesQuery.isLoading ||
      monitor.validatorsQuery.isLoading ||
      monitor.rpcLatencyQuery.isLoading ||
      monitor.healthQuery.isLoading,
    [monitor],
  );

  const refetchAll = () => {
    void Promise.all([
      monitor.overviewQuery.refetch(),
      monitor.tpsQuery.refetch(),
      monitor.blockTimeQuery.refetch(),
      monitor.throughputQuery.refetch(),
      monitor.feesQuery.refetch(),
      monitor.validatorsQuery.refetch(),
      monitor.rpcLatencyQuery.refetch(),
      monitor.healthQuery.refetch(),
      monitor.eventsQuery.refetch(),
    ]);
  };

  if (monitor.overviewQuery.isError && !monitor.overviewQuery.data) {
    return (
      <div className="space-y-6">
        <NetworkMonitorHeader
          overview={monitor.overviewQuery.data}
          range={range}
          autoRefresh={autoRefresh}
          onRangeChange={setRange}
          onAutoRefreshChange={setAutoRefresh}
          onRefresh={refetchAll}
        />
        <GlassCard>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold text-white">Network monitor unavailable</div>
              <div className="mt-1 text-sm text-slate-400">
                {monitor.overviewQuery.error instanceof Error
                  ? monitor.overviewQuery.error.message
                  : "The network monitor could not fetch Solana metrics."}
              </div>
            </div>
            <Button onClick={refetchAll}>Retry</Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NetworkMonitorHeader
        overview={monitor.overviewQuery.data}
        range={range}
        autoRefresh={autoRefresh}
        onRangeChange={setRange}
        onAutoRefreshChange={setAutoRefresh}
        onRefresh={refetchAll}
      />

      {isLoading && !monitor.overviewQuery.data ? (
        <GlassCard>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            Collecting live Solana network metrics from the configured RPC endpoint.
          </div>
        </GlassCard>
      ) : null}

      {monitor.overviewQuery.data?.cards?.length ? <NetworkOverviewCards cards={monitor.overviewQuery.data.cards} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <TPSChartCard data={monitor.tpsQuery.data} />
        <BlockTimeChartCard data={monitor.blockTimeQuery.data} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ThroughputChartCard data={monitor.throughputQuery.data} />
        <NetworkHealthScoreCard data={monitor.healthQuery.data} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <NetworkFeesCard data={monitor.feesQuery.data} />
        <ValidatorCountCard data={monitor.validatorsQuery.data} />
        <RPCLatencyCard data={monitor.rpcLatencyQuery.data} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ProtocolImpactPanel
          summary={monitor.healthQuery.data?.protocolImpact.summary}
          items={monitor.healthQuery.data?.protocolImpact.items}
        />
        <NetworkStatusFeed events={monitor.eventsQuery.data?.items || []} />
      </div>

      <EndpointComparisonTable endpoints={monitor.overviewQuery.data?.endpointComparison || []} />
    </div>
  );
}
