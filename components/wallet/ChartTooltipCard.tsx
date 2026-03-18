"use client";

import { cn } from "@/utils/cn";

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
};

export function ChartTooltipCard({
  active,
  payload,
  label,
  labelPrefix,
  className,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  labelPrefix?: string;
  className?: string;
  formatter?: (value: number | string, name?: string) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "min-w-[11rem] rounded-lg border border-cyan-400/14 bg-[rgba(7,12,24,0.96)] px-3 py-2.5 shadow-[0_20px_42px_rgba(0,0,0,0.34)] backdrop-blur-xl",
        className,
      )}
    >
      {label !== undefined ? (
        <div className="border-b border-white/8 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          {labelPrefix ? `${labelPrefix} ` : ""}
          {label}
        </div>
      ) : null}
      <div className="space-y-2 pt-2">
        {payload.map((item) => (
          <div key={`${item.name}-${item.value}`} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color || "#22D3EE" }}
              />
              <span>{item.name || "Value"}</span>
            </div>
            <span className="font-semibold text-white">
              {formatter ? formatter(item.value ?? 0, item.name) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
