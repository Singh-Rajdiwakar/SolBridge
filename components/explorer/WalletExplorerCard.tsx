"use client";

import { Activity, Coins, Link2, ShieldCheck, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard, SectionHeader } from "@/components/shared";
import type { ExplorerWalletResult } from "@/types";

export function WalletExplorerCard({ result }: { result: ExplorerWalletResult }) {
  return (
    <GlassCard className="space-y-5">
      <SectionHeader
        title="Wallet Summary"
        subtitle="Direct on-chain balance visibility with mirrored relationship enrichment."
        action={<Badge variant="success">Wallet</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="SOL Balance" value={`${result.solBalance.toFixed(4)} SOL`} icon={Wallet} />
        <MetricCard label="Token Accounts" value={String(result.tokenAccountsCount)} icon={Coins} />
        <MetricCard label="Recent Signatures" value={String(result.recentTransactionCount)} icon={Activity} />
        <MetricCard label="Counterparties" value={String(result.interactedWallets.length)} icon={Link2} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Wallet Identity
          </div>
          <div className="mt-3 text-xl font-semibold text-white">{result.addressLabel}</div>
          <div className="mt-1 font-mono text-sm text-slate-400">{result.walletAddress}</div>
          {result.note ? <div className="mt-3 text-sm text-slate-300">{result.note}</div> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {result.tags.map((tag) => (
              <Badge key={tag} variant={tag === "Verified on-chain" ? "success" : "muted"}>
                {tag}
              </Badge>
            ))}
          </div>
          {result.latestActivityAt ? (
            <div className="mt-4 text-sm text-slate-400">Latest activity: {new Date(result.latestActivityAt).toLocaleString()}</div>
          ) : null}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Protocol Exposure</div>
          <div className="mt-4 space-y-3">
            {result.protocolExposure.map((exposure) => (
              <div key={exposure.module}>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{exposure.label}</span>
                  <span>{exposure.activityCount}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/5">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.55),rgba(59,130,246,0.85))]"
                    style={{ width: `${Math.max(6, Math.min(100, exposure.activityCount * 22))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Token Balances</div>
          <div className="space-y-3">
            {result.tokenBalances.length ? (
              result.tokenBalances.slice(0, 6).map((token) => (
                <div key={token.mint} className="flex items-center justify-between rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div>
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-xs text-slate-500">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">{token.amount.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">${token.usdValue.toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No SPL token accounts with active balances were detected.</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Related Entity Discovery</div>
          <div className="space-y-3">
            {result.relatedEntityDiscovery.topCounterparties.slice(0, 4).map((counterparty) => (
              <div key={counterparty.address} className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{counterparty.label}</div>
                    <div className="font-mono text-xs text-slate-500">{counterparty.shortAddress}</div>
                  </div>
                  <Badge variant="muted">{counterparty.txCount} tx</Badge>
                </div>
              </div>
            ))}
            <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
              Frequently moved token: <span className="font-semibold text-white">{result.relatedEntityDiscovery.frequentlyMovedToken}</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-4 w-4 text-cyan-300" />
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
