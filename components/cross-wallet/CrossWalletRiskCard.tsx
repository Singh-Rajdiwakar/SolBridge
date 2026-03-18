"use client";

import { ShieldCheck, TriangleAlert } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { CrossWalletRiskResponse } from "@/types";

export function CrossWalletRiskCard({ data }: { data?: CrossWalletRiskResponse }) {
  if (!data) {
    return (
      <SectionCard title="Cross-Wallet Risk" description="Weighted safety score across concentration, borrow exposure, LP activity, and mirrored transfer spikes.">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Risk analytics will appear after a wallet group is selected.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Cross-Wallet Risk"
      description="Aggregate safety posture with individual wallet risk drivers."
      action={data.aggregate.score >= 70 ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <TriangleAlert className="h-4 w-4 text-amber-300" />}
    >
      <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Aggregate Score</div>
          <div className="mt-3 text-4xl font-semibold text-white">{data.aggregate.score}<span className="ml-2 text-lg text-slate-500">/100</span></div>
          <div className="mt-2 text-sm text-slate-300">{data.aggregate.label}</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
            <div
              className={`h-full rounded-full ${data.aggregate.score >= 70 ? "bg-emerald-400" : data.aggregate.score >= 40 ? "bg-amber-400" : "bg-rose-400"}`}
              style={{ width: `${data.aggregate.score}%` }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {data.aggregate.recommendations.map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {data.wallets.map((wallet) => (
            <div key={wallet.walletAddress} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{wallet.walletLabel}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{wallet.label}</div>
                </div>
                <div className={`rounded-md px-2.5 py-1 text-xs font-semibold ${wallet.score >= 70 ? "bg-emerald-500/12 text-emerald-300" : wallet.score >= 40 ? "bg-amber-500/12 text-amber-300" : "bg-rose-500/12 text-rose-300"}`}>
                  {wallet.score}/100
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-300">
                <div className="flex items-center justify-between"><span>Top Asset</span><span>{wallet.drivers.topAssetRatio}%</span></div>
                <div className="flex items-center justify-between"><span>Stablecoin Ratio</span><span>{wallet.drivers.stablecoinRatio}%</span></div>
                <div className="flex items-center justify-between"><span>Borrow Ratio</span><span>{wallet.drivers.borrowRatio}%</span></div>
                <div className="flex items-center justify-between"><span>Failed Tx</span><span>{wallet.drivers.failedRatio}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
