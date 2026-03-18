"use client";

import type { MarketRange } from "@/types";
import { Button } from "@/components/ui/button";
import { MARKET_RANGE_OPTIONS } from "@/components/markets/utils";
import { cn } from "@/utils/cn";

export function TimeRangeSelector({
  value,
  onChange,
}: {
  value: MarketRange;
  onChange: (range: MarketRange) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MARKET_RANGE_OPTIONS.map((range) => (
        <Button
          key={range}
          type="button"
          variant={value === range ? "default" : "secondary"}
          size="sm"
          className={cn("min-w-11", value === range && "shadow-[0_12px_34px_rgba(23,75,181,0.28)]")}
          onClick={() => onChange(range)}
        >
          {range}
        </Button>
      ))}
    </div>
  );
}
