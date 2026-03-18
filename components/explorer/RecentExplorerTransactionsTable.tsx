"use client";

import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard, SectionHeader } from "@/components/shared";
import { EmptyStateBlock } from "@/components/wallet/EmptyStateBlock";
import type { ExplorerRecentTransaction } from "@/types";

export function RecentExplorerTransactionsTable({
  items,
  title = "Recent Transactions",
  subtitle = "Recent signatures and mirrored classifications for the selected entity.",
}: {
  items?: ExplorerRecentTransaction[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <GlassCard className="space-y-4">
      <SectionHeader title={title} subtitle={subtitle} />

      {items?.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.signature} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/25 hover:bg-white/[0.04]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-mono text-sm text-white">{item.shortSignature}</div>
                    <Badge variant={item.status.toLowerCase() === "confirmed" ? "success" : "danger"}>
                      {item.status}
                    </Badge>
                    <Badge variant="muted">{item.protocolModule}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    {item.type} • slot {item.slot} • {item.tokenSymbol}
                    {item.blockTime ? ` • ${new Date(item.blockTime).toLocaleString()}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{item.amount ? item.amount.toLocaleString() : "--"}</div>
                    <div className="text-xs text-slate-500">{item.tokenSymbol}</div>
                  </div>
                  <a
                    href={item.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-cyan-200 transition hover:text-white"
                  >
                    View
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStateBlock
          title="No explorer transactions yet"
          description="Search a wallet, token, or slot to render recent signatures and classification data."
        />
      )}
    </GlassCard>
  );
}
