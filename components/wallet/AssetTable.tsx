"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Eye, Star } from "lucide-react";

import { SearchBar, SectionHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { TOKEN_OPTIONS } from "@/lib/constants";
import type { WalletTokenBalance } from "@/types";
import { cn } from "@/utils/cn";
import { formatCurrency, formatNumber } from "@/utils/format";

type SortKey = "value" | "change" | "balance" | "symbol";

export function AssetTable({
  tokens,
  onSelectToken,
}: {
  tokens: WalletTokenBalance[];
  onSelectToken: (token: WalletTokenBalance) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(["SOL", "USDC"]);

  const rows = useMemo(() => {
    const filtered = tokens.filter((token) => {
      const meta = TOKEN_OPTIONS.find((entry) => entry.value === token.symbol);
      const search = query.trim().toLowerCase();
      const matchesQuery =
        !search ||
        token.symbol.toLowerCase().includes(search) ||
        meta?.name?.toLowerCase().includes(search);
      const matchesWatchlist = !watchlistOnly || watchlist.includes(token.symbol);
      return matchesQuery && matchesWatchlist;
    });

    return filtered.sort((a, b) => {
      switch (sortKey) {
        case "balance":
          return b.balance - a.balance;
        case "change":
          return b.change - a.change;
        case "symbol":
          return a.symbol.localeCompare(b.symbol);
        case "value":
        default:
          return b.usdValue - a.usdValue;
      }
    });
  }, [query, sortKey, tokens, watchlist, watchlistOnly]);

  return (
    <div className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,27,49,0.94),rgba(10,16,32,0.9))] p-5">
      <SectionHeader
        title="Asset List"
        subtitle="Search, sort, and drill into token balances with a recruiter-grade wallet asset table."
        action={
          <div className="flex items-center gap-2">
            <Button variant={watchlistOnly ? "default" : "secondary"} size="sm" onClick={() => setWatchlistOnly((current) => !current)}>
              <Star className="h-4 w-4" />
              Watchlist
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setSortKey((current) =>
                  current === "value" ? "change" : current === "change" ? "balance" : current === "balance" ? "symbol" : "value",
                )
              }
            >
              <ArrowDownWideNarrow className="h-4 w-4" />
              Sort
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="w-full max-w-xs">
          <SearchBar value={query} onChange={setQuery} placeholder="Search asset or symbol" />
        </div>
        <div className="hidden text-xs uppercase tracking-[0.18em] text-slate-500 md:block">Sorted by {sortKey}</div>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="grid grid-cols-[1.25fr_0.7fr_0.65fr_0.7fr_0.55fr_auto] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          <div>Asset</div>
          <div>Balance</div>
          <div>Price</div>
          <div>Value</div>
          <div>24h</div>
          <div>Action</div>
        </div>

        {rows.map((token) => {
          const meta = TOKEN_OPTIONS.find((entry) => entry.value === token.symbol);
          const price = token.balance > 0 ? token.usdValue / token.balance : 0;
          const inWatchlist = watchlist.includes(token.symbol);

          return (
            <div
              key={token.symbol}
              className="grid grid-cols-[1.25fr_0.7fr_0.65fr_0.7fr_0.55fr_auto] gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-4 transition hover:bg-white/[0.04]"
            >
              <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => onSelectToken(token)}>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br text-sm font-semibold text-white shadow-glow", meta?.color || "from-cyan-300 to-blue-500")}>
                  {token.symbol.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{meta?.name || token.symbol}</div>
                  <div className="text-sm text-slate-400">{token.symbol}</div>
                </div>
              </button>
              <div className="text-sm font-medium text-white">{formatNumber(token.balance, token.symbol === "BONK" ? 0 : 4)}</div>
              <div className="text-sm text-slate-300">{formatCurrency(price)}</div>
              <div className="text-sm font-medium text-white">{formatCurrency(token.usdValue)}</div>
              <div className={cn("text-sm font-medium", token.change >= 0 ? "text-emerald-300" : "text-rose-300")}>
                {token.change >= 0 ? "+" : ""}
                {formatNumber(token.change, 2)}%
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setWatchlist((current) =>
                      inWatchlist ? current.filter((entry) => entry !== token.symbol) : [...current, token.symbol],
                    )
                  }
                >
                  <Star className={cn("h-4 w-4", inWatchlist && "fill-cyan-300 text-cyan-300")} />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onSelectToken(token)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
