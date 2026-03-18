"use client";

import { ExternalLink } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import type { CrossWalletActivityResponse } from "@/types";
import { formatDate } from "@/utils/format";

export function CrossWalletActivityHeatmap({ data }: { data?: CrossWalletActivityResponse }) {
  if (!data) {
    return (
      <SectionCard title="Cross-Wallet Activity" description="Heatmap and event timeline for the selected wallet group.">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Activity data will populate after mirrored transactions are indexed.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Cross-Wallet Activity" description="Heatmap of wallet cadence with a timeline of major mirrored events.">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {data.heatmap.map((row) => (
            <div key={row.walletAddress} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 text-sm font-semibold text-white">{row.walletLabel}</div>
              <div className="grid grid-cols-7 gap-2">
                {row.cells.map((cell) => (
                  <div
                    key={cell.key}
                    className="rounded-md border border-white/10 p-2 text-center"
                    style={{
                      background: cell.count === 0 ? "rgba(255,255,255,0.03)" : `rgba(34,211,238,${Math.min(0.16 + cell.count * 0.12, 0.72)})`,
                    }}
                    title={`${cell.label}: ${cell.count} activity`}
                  >
                    <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{cell.label}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{cell.count}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {data.timeline.length > 0 ? data.timeline.map((event) => (
            <div key={`${event.walletAddress}-${event.signature}-${event.createdAt}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{event.type}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{event.walletLabel} • {event.protocolModule || "wallet"}</div>
                </div>
                {event.explorerUrl ? (
                  <Button variant="ghost" size="icon" onClick={() => window.open(event.explorerUrl, "_blank", "noopener,noreferrer")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 text-sm text-slate-300">
                {event.amount} {event.tokenSymbol} • {event.status}
              </div>
              <div className="mt-2 text-xs text-slate-500">{formatDate(event.createdAt)}</div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
              No mirrored activity yet for the selected wallet group.
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
