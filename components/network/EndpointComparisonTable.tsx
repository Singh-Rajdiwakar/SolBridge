"use client";

import { CheckCircle2, Server, WifiOff } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import type { NetworkEndpointStatus } from "@/types";
import { formatNumber } from "@/utils/format";

export function EndpointComparisonTable({ endpoints }: { endpoints: NetworkEndpointStatus[] }) {
  return (
    <GlassCard>
      <SectionHeader
        title="Endpoint Comparison"
        subtitle="Latency and readiness comparison for the configured RPC path and available fallback endpoint."
      />
      <div className="space-y-3">
        {endpoints.length ? (
          endpoints.map((endpoint) => (
            <div key={endpoint.endpointUrl} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-cyan-300" />
                    <div className="font-medium text-white">{endpoint.endpointLabel}</div>
                    {endpoint.recommended ? (
                      <span className="rounded-full bg-cyan-500/12 px-2 py-0.5 text-[11px] uppercase tracking-[0.16em] text-cyan-200">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500">{endpoint.endpointUrl}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Latency" value={`${formatNumber(endpoint.latency, 0)} ms`} />
                  <Metric label="Version" value={endpoint.version} />
                  <Metric label="Status" value={endpoint.status} degraded={endpoint.status === "degraded"} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
            Endpoint comparison will appear after the monitor completes a successful RPC probe.
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function Metric({ label, value, degraded = false }: { label: string; value: string; degraded?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
        {degraded ? <WifiOff className="h-4 w-4 text-amber-300" /> : <CheckCircle2 className="h-4 w-4 text-cyan-300" />}
        {value}
      </div>
    </div>
  );
}
