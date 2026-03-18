"use client";

import { formatCompactCurrency, formatRelativeTime } from "@/utils/format";
import type { CrossWalletSummaryWallet } from "@/types";

export function WalletComparisonTable({ wallets }: { wallets: CrossWalletSummaryWallet[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <th className="pb-3 pr-4">Wallet</th>
            <th className="pb-3 pr-4">Value</th>
            <th className="pb-3 pr-4">PnL</th>
            <th className="pb-3 pr-4">Risk</th>
            <th className="pb-3 pr-4">Diversity</th>
            <th className="pb-3 pr-4">Exposure</th>
            <th className="pb-3">Recent Activity</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((wallet) => (
            <tr key={wallet.walletAddress} className="border-b border-white/6 last:border-b-0">
              <td className="py-4 pr-4">
                <div className="font-medium text-white">{wallet.label}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{wallet.type}</div>
              </td>
              <td className="py-4 pr-4 text-white">{formatCompactCurrency(wallet.currentValue)}</td>
              <td className={`py-4 pr-4 ${wallet.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {formatCompactCurrency(wallet.pnl)}
              </td>
              <td className="py-4 pr-4 text-white">{wallet.risk.score}</td>
              <td className="py-4 pr-4 text-white">{wallet.diversity.score}</td>
              <td className="py-4 pr-4 text-slate-300">
                {wallet.exposures.lending > 0
                  ? "Lending"
                  : wallet.exposures.liquidity > 0
                    ? "Liquidity"
                    : wallet.exposures.staking > 0
                      ? "Staking"
                      : "Spot"}
              </td>
              <td className="py-4 text-slate-400">
                {wallet.recentActivity ? formatRelativeTime(wallet.recentActivity) : "No mirrored activity"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
