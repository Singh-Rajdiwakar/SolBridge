"use client";

import type { ReactNode } from "react";
import { ExternalLink, Shield, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CrossWalletSummaryWallet } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/utils/format";
import { getAddressExplorerUrl } from "@/lib/solana/explorer";

export function TrackedWalletCard({ wallet }: { wallet: CrossWalletSummaryWallet }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-white">{wallet.label}</div>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
              {wallet.type}
            </span>
            {wallet.isPrimary ? (
              <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                Primary
              </span>
            ) : null}
            {wallet.isFavorite ? (
              <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-200">
                Favorite
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-sm text-slate-400">{wallet.walletAddress}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => window.open(getAddressExplorerUrl(wallet.walletAddress), "_blank", "noopener,noreferrer")}>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Metric label="Current Value" value={formatCompactCurrency(wallet.currentValue)} />
        <Metric label="24H Change" value={formatPercent(wallet.change24h, 2)} positive={wallet.change24h >= 0} />
        <Metric label="PnL" value={formatCompactCurrency(wallet.pnl)} positive={wallet.pnl >= 0} />
        <Metric label="Risk Score" value={`${wallet.risk.score}/100`} icon={<Shield className="h-3.5 w-3.5" />} />
        <Metric label="Diversification" value={`${wallet.diversity.score}/100`} icon={<Sparkles className="h-3.5 w-3.5" />} />
        <Metric label="Activity" value={`${wallet.txCount} tx`} icon={<TrendingUp className="h-3.5 w-3.5" />} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  positive,
  icon,
}: {
  label: string;
  value: string;
  positive?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {icon}
        {label}
      </div>
      <div className={`mt-2 text-lg font-semibold ${positive === undefined ? "text-white" : positive ? "text-emerald-300" : "text-rose-300"}`}>
        {value}
      </div>
    </div>
  );
}
