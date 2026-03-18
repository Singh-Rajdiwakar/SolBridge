"use client";

import type { SocialReputationRecord, SocialRiskLike } from "@/types";

export function WalletReputationCard({
  reputation,
  risk,
  diversity,
}: {
  reputation?: SocialReputationRecord | null;
  risk?: SocialRiskLike | null;
  diversity?: SocialRiskLike | null;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-cyan-400/15 bg-cyan-500/[0.05] p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Reputation</div>
        <div className="mt-3 text-2xl font-semibold text-white">{reputation?.score ?? "--"}</div>
        <div className="mt-1 text-sm text-cyan-200">{reputation?.label || "Awaiting signal"}</div>
        <div className="mt-2 text-sm text-slate-400">{reputation?.summary || "Profile confidence will improve as more wallet activity is indexed."}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Risk</div>
        <div className="mt-3 text-2xl font-semibold text-white">{risk?.score ?? "--"}</div>
        <div className="mt-1 text-sm text-slate-200">{risk?.label || "No risk signal"}</div>
        <div className="mt-2 text-sm text-slate-400">{risk?.explanation || "Risk scoring reflects concentration, leverage, and protocol mix."}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Diversification</div>
        <div className="mt-3 text-2xl font-semibold text-white">{diversity?.score ?? "--"}</div>
        <div className="mt-1 text-sm text-slate-200">{diversity?.label || "No diversity signal"}</div>
        <div className="mt-2 text-sm text-slate-400">{diversity?.explanation || "Distribution across assets and protocols improves resilience."}</div>
      </div>
    </div>
  );
}
