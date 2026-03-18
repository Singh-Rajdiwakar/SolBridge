"use client";

import { Coins, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard, SectionHeader } from "@/components/shared";
import type { ExplorerTokenResult } from "@/types";

export function TokenMintExplorerCard({ result }: { result: ExplorerTokenResult }) {
  return (
    <GlassCard className="space-y-5">
      <SectionHeader
        title="Token Mint Summary"
        subtitle="Authority, supply, and holder visibility for SPL token verification."
        action={<Badge variant={result.knownByApp ? "success" : "muted"}>{result.knownByApp ? "Known Token" : "On-chain Only"}</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Symbol" value={result.symbol || "--"} />
        <MetricCard label="Decimals" value={String(result.decimals)} />
        <MetricCard label="Supply" value={result.totalSupply.toLocaleString()} />
        <MetricCard label="Accounts" value={String(result.tokenAccountsCount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            <Coins className="h-4 w-4 text-cyan-300" />
            Mint Transparency
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <Field label="Mint Address" value={result.mintAddress} mono />
            <Field label="Token Name" value={result.name || "Unknown"} />
            <Field label="Mint Authority" value={result.mintAuthority || "None"} mono />
            <Field label="Freeze Authority" value={result.freezeAuthority || "None"} mono />
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Largest Token Accounts
          </div>
          <div className="mt-4 space-y-3">
            {result.largestAccounts.length ? (
              result.largestAccounts.map((entry) => (
                <div key={entry.address} className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div className="font-medium text-white">{entry.amount.toLocaleString()}</div>
                  <div className="font-mono text-xs text-slate-500">{entry.address}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">Largest holder information is unavailable for this mint.</div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-1 break-all ${mono ? "font-mono text-xs" : "text-sm"} text-white`}>{value}</div>
    </div>
  );
}
