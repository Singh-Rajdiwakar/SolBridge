"use client";

import type { MarketCoin } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CoinSelector({
  coins,
  value,
  onChange,
}: {
  coins: MarketCoin[];
  value: string;
  onChange: (coinId: string) => void;
}) {
  if (coins.length === 0) {
    return (
      <div className="flex h-10 min-w-[12rem] items-center rounded-md border border-white/10 bg-[rgba(17,27,49,0.88)] px-3 text-sm text-slate-500">
        Loading markets...
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full min-w-[12rem]">
        <SelectValue placeholder="Select coin" />
      </SelectTrigger>
      <SelectContent>
        {coins.map((coin) => (
          <SelectItem key={coin.id} value={coin.id}>
            {coin.name} ({coin.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
