"use client";

import { Activity, ExternalLink } from "lucide-react";
import Link from "next/link";

import type { SocialFeedItem } from "@/types";
import { formatCompactCurrency, formatRelativeTime } from "@/utils/format";

export function SocialActivityFeed({
  items,
  emptyTitle = "No social activity yet",
  emptyDescription = "Follow wallets or share a public snapshot to start building a finance-first activity feed.",
}: {
  items?: SocialFeedItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!items?.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
          <Activity className="h-5 w-5" />
        </div>
        <div className="mt-4 text-lg font-semibold text-white">{emptyTitle}</div>
        <div className="mt-2 text-sm text-slate-400">{emptyDescription}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <div className="mt-1 text-sm text-slate-400">{item.description}</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{formatRelativeTime(item.createdAt)}</div>
              <div className="mt-1 uppercase tracking-[0.18em]">{item.protocolModule}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <Link href={`/profile/${item.walletAddress}`} className="text-cyan-200 transition hover:text-cyan-100">
              {item.displayName}
            </Link>
            {item.amount ? <div className="text-slate-300">{formatCompactCurrency(item.amount)}</div> : null}
            {item.signature && item.explorerUrl ? (
              <a href={item.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-400 transition hover:text-white">
                View tx
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
