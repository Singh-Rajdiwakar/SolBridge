"use client";

import { ExternalLink, Waves } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import type { CrossWalletWhaleSignalsResponse } from "@/types";
import { formatCompactCurrency, formatDate, formatNumber } from "@/utils/format";

export function WhaleActivityPanel({ data }: { data?: CrossWalletWhaleSignalsResponse }) {
  if (!data) {
    return (
      <SectionCard title="Whale Activity" description="Large wallet movement and outlier transaction detection across tracked sets.">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Whale detection becomes active once mirrored transaction volume is available.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Whale Activity" description="Rule-based detection for outsized balance, transfer, and volume behavior." action={<Waves className="h-4 w-4 text-cyan-300" />}>
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-3">
          <Metric label="Top Balance Wallet" value={data.topBalanceWallet ? `${data.topBalanceWallet.walletLabel} • ${formatCompactCurrency(data.topBalanceWallet.totalValue)}` : "No signal"} />
          <Metric label="Top Volume Wallet" value={data.topVolumeWallet ? `${data.topVolumeWallet.walletLabel} • ${formatNumber(data.topVolumeWallet.volume, 2)}` : "No signal"} />
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Top Transaction of the Window</div>
            {data.topTransaction ? (
              <div className="mt-3">
                <div className="text-base font-semibold text-white">{data.topTransaction.walletLabel}</div>
                <div className="mt-1 text-sm text-slate-300">
                  {formatNumber(data.topTransaction.amount, 4)} {data.topTransaction.tokenSymbol} | {data.topTransaction.type}
                </div>
                <div className="mt-1 text-xs text-slate-500">{formatDate(data.topTransaction.createdAt)}</div>
                {data.topTransaction.explorerUrl ? (
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => window.open(data.topTransaction?.explorerUrl, "_blank", "noopener,noreferrer")}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Explorer
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-400">No outsized transfer detected yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {data.flags.length > 0 ? data.flags.map((flag) => (
            <div key={`${flag.walletAddress}-${flag.title}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{flag.title}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{flag.walletLabel}</div>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${flag.severity === "warning" ? "bg-amber-500/12 text-amber-300" : "bg-cyan-400/10 text-cyan-200"}`}>
                  {flag.severity}
                </span>
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{flag.description}</div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
              No whale-style anomalies detected in the selected wallet group.
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-white">{value}</div>
    </div>
  );
}
