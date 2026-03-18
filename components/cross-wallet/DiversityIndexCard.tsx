"use client";

import { Sparkles } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { CrossWalletDiversityResponse } from "@/types";

export function DiversityIndexCard({ data }: { data?: CrossWalletDiversityResponse }) {
  if (!data) {
    return (
      <SectionCard title="Diversity Index" description="Asset spread and protocol mix across the selected wallet group.">
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
          Diversity metrics will render after tracked wallets are available.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Diversity Index" description="Weighted diversification score based on token spread, stablecoin coverage, and exposure mix." action={<Sparkles className="h-4 w-4 text-cyan-300" />}>
      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Aggregate Diversity</div>
          <div className="mt-3 text-4xl font-semibold text-white">{data.aggregate.score}<span className="ml-2 text-lg text-slate-500">/100</span></div>
          <div className="mt-2 text-sm text-slate-300">{data.aggregate.label}</div>
          <div className="mt-4 text-sm leading-6 text-slate-400">{data.aggregate.explanation}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="Unique Tokens" value={String(data.aggregate.uniqueTokens)} />
            <Metric label="Stablecoin Ratio" value={`${data.aggregate.stablecoinRatio}%`} />
            <Metric label="Top Asset Ratio" value={`${data.aggregate.topAssetRatio}%`} />
            <Metric label="Exposure Buckets" value={String(data.aggregate.activeExposureBuckets)} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {data.wallets.map((wallet) => (
            <div key={wallet.walletAddress} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{wallet.walletLabel}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{wallet.label}</div>
                </div>
                <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                  {wallet.score}/100
                </div>
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-400">{wallet.explanation}</div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-white">{value}</div>
    </div>
  );
}
