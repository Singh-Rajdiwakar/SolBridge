import { Coins, Droplets, Gauge, ShieldAlert, TrendingUp, WalletCards } from "lucide-react";

import type { TreasuryOverviewResponse } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

const items: Array<{
  key: "totalTreasuryValue" | "liquidAssets" | "committedAssets" | "stablecoinRatio" | "change24h" | "treasuryHealthScore";
  label: string;
  icon: typeof WalletCards;
  percent?: boolean;
}> = [
  { key: "totalTreasuryValue", label: "Total Treasury", icon: WalletCards },
  { key: "liquidAssets", label: "Liquid Assets", icon: Droplets },
  { key: "committedAssets", label: "Committed", icon: Coins },
  { key: "stablecoinRatio", label: "Stable Ratio", icon: ShieldAlert, percent: true },
  { key: "change24h", label: "24H Change", icon: TrendingUp, percent: true },
  { key: "treasuryHealthScore", label: "Health Score", icon: Gauge },
] as const;

export function TreasuryOverviewCards({ overview }: { overview?: TreasuryOverviewResponse }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        const value = Number(overview?.[item.key] || 0);
        return (
          <div key={item.key} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
            <div className="mt-3 text-2xl font-semibold text-white">
              {item.percent ? formatPercent(value) : item.key === "treasuryHealthScore" ? `${value}/100` : formatCompactCurrency(value)}
            </div>
            {item.key === "treasuryHealthScore" ? (
              <div className="mt-1 text-sm text-cyan-200">{overview?.treasuryHealthLabel || "Awaiting classification"}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
