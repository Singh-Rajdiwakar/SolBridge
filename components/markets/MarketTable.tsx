"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowUpDown, Plus, Search, Star } from "lucide-react";

import type { MarketCoin } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  formatMarketCompactCurrency,
  formatMarketCurrency,
  formatMarketNumber,
  formatMarketPercent,
} from "@/components/markets/utils";
import { cn } from "@/utils/cn";

type SortKey = "rank" | "price" | "priceChange24h" | "marketCap" | "totalVolume";

export function MarketTable({
  coins,
  currency,
  loading,
  watchlist,
  page,
  perPage,
  total,
  onView,
  onToggleWatchlist,
  onCompare,
  onPageChange,
}: {
  coins: MarketCoin[];
  currency: string;
  loading?: boolean;
  watchlist: string[];
  page: number;
  perPage: number;
  total: number;
  onView: (coinId: string) => void;
  onToggleWatchlist: (coinId: string) => void;
  onCompare: (coinId: string) => void;
  onPageChange: (page: number) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const search = query.toLowerCase().trim();
    const base = search
      ? coins.filter(
          (coin) =>
            coin.name.toLowerCase().includes(search) || coin.symbol.toLowerCase().includes(search),
        )
      : coins;

    return [...base].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [coins, query, sortDirection, sortKey]);

  if (loading) {
    return <LoadingSkeleton type="table" />;
  }

  return (
    <div className="glass-panel space-y-4 border-white/8 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Market Table</div>
          <div className="mt-2 text-xl font-semibold text-white">Live market screener</div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="w-full pl-10 sm:w-72"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search BTC, SOL, ETH..."
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            }}
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["rank", "price", "priceChange24h", "marketCap", "totalVolume"] as SortKey[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={sortKey === key ? "default" : "secondary"}
            onClick={() => setSortKey(key)}
          >
            {key === "priceChange24h"
              ? "24h %"
              : key === "totalVolume"
                ? "Volume"
                : key.charAt(0).toUpperCase() + key.slice(1)}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Coin</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">1h %</th>
                <th className="px-4 py-3">24h %</th>
                <th className="px-4 py-3">7d %</th>
                <th className="px-4 py-3">Market Cap</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Supply</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((coin) => (
                <tr key={coin.id} className="bg-white/[0.01] transition hover:bg-white/[0.03]">
                  <td className="px-4 py-4 text-slate-400">#{coin.rank}</td>
                  <td className="px-4 py-4">
                    <button type="button" className="flex items-center gap-3 text-left" onClick={() => onView(coin.id)}>
                      <Image src={coin.image} alt={coin.name} width={32} height={32} className="h-8 w-8 rounded-full" />
                      <div>
                        <div className="font-semibold text-white">{coin.name}</div>
                        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{coin.symbol}</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-4 font-medium text-white">{formatMarketCurrency(coin.price, currency)}</td>
                  <td className={cn("px-4 py-4", coin.priceChange1h >= 0 ? "text-emerald-300" : "text-rose-300")}>
                    {formatMarketPercent(coin.priceChange1h)}
                  </td>
                  <td className={cn("px-4 py-4", coin.priceChange24h >= 0 ? "text-emerald-300" : "text-rose-300")}>
                    {formatMarketPercent(coin.priceChange24h)}
                  </td>
                  <td className={cn("px-4 py-4", coin.priceChange7d >= 0 ? "text-emerald-300" : "text-rose-300")}>
                    {formatMarketPercent(coin.priceChange7d)}
                  </td>
                  <td className="px-4 py-4 text-slate-300">{formatMarketCompactCurrency(coin.marketCap, currency)}</td>
                  <td className="px-4 py-4 text-slate-300">{formatMarketCompactCurrency(coin.totalVolume, currency)}</td>
                  <td className="px-4 py-4 text-slate-300">{formatMarketNumber(coin.circulatingSupply, 0)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onView(coin.id)}>
                        View
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => onCompare(coin.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => onToggleWatchlist(coin.id)}>
                        <Star className={cn("h-4 w-4", watchlist.includes(coin.id) && "fill-current text-amber-300")} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/8 pt-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} of {total} tracked markets
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          <div className="rounded-md border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-400">
            Page {page}
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={page * perPage >= total}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
