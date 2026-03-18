"use client";

import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExplorerSearchType } from "@/types";
import type { ExplorerRecentSearch } from "@/lib/solana/explorerService";

export function ExplorerSearchBar({
  searchType,
  query,
  onQueryChange,
  onSubmit,
  isLoading,
  placeholder,
  error,
  recentSearches,
  onRecentSearchSelect,
}: {
  searchType: ExplorerSearchType;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder: string;
  error?: string | null;
  recentSearches?: ExplorerRecentSearch[];
  onRecentSearchSelect?: (item: ExplorerRecentSearch) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="h-12 pl-11 pr-12"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <Button onClick={onSubmit} className="h-12 min-w-36">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search {searchType === "block" ? "Block" : searchType === "token" ? "Mint" : searchType}
        </Button>
      </div>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}

      {recentSearches?.length ? (
        <div className="flex flex-wrap gap-2">
          {recentSearches.map((item) => (
            <button
              key={`${item.type}-${item.value}`}
              type="button"
              onClick={() => onRecentSearchSelect?.(item)}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
            >
              {item.type}
              <span className="font-mono normal-case tracking-normal text-slate-400">
                {item.value.length > 18 ? `${item.value.slice(0, 8)}...${item.value.slice(-6)}` : item.value}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
