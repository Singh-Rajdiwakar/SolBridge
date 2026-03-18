import { ExternalLink } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { SectionCard } from "@/components/dashboard/section-card";
import type { TreasuryAssetsResponse } from "@/types";
import { formatCompactCurrency, formatNumber, formatPercent } from "@/utils/format";

export function TreasuryAssetsTable({ data }: { data?: TreasuryAssetsResponse }) {
  return (
    <SectionCard title="Treasury Assets" description="On-chain treasury holdings with category and allocation context.">
      {!data?.assets?.length ? (
        <EmptyState title="Treasury not configured yet" description="Add treasury wallets or wait for on-chain balance discovery to populate reserve holdings." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Asset</th>
                <th className="px-3 py-3">Balance</th>
                <th className="px-3 py-3">USD Value</th>
                <th className="px-3 py-3">Allocation</th>
                <th className="px-3 py-3">24H</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3 text-right">Explorer</th>
              </tr>
            </thead>
            <tbody>
              {data.assets.map((asset) => (
                <tr key={`${asset.symbol}-${asset.tokenMint}`} className="border-t border-white/6 text-slate-300">
                  <td className="px-3 py-3">
                    <div className="font-medium text-white">{asset.symbol}</div>
                    <div className="text-xs text-slate-500">{asset.tag}</div>
                  </td>
                  <td className="px-3 py-3">{formatNumber(asset.balance, 4)}</td>
                  <td className="px-3 py-3">{formatCompactCurrency(asset.usdValue)}</td>
                  <td className="px-3 py-3">{formatPercent(asset.allocationPercent)}</td>
                  <td className={`px-3 py-3 ${asset.change24h >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatPercent(asset.change24h)}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {asset.explorerUrl ? (
                      <a href={asset.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100">
                        View
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">n/a</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
