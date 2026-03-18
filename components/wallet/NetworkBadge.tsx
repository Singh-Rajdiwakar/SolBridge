"use client";

import { cn } from "@/utils/cn";

export function NetworkBadge({
  network = "Devnet",
  pulse = true,
  className,
}: {
  network?: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[rgba(224,185,75,0.18)] bg-[rgba(224,185,75,0.08)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f3d57c]",
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full bg-emerald-400", pulse && "animate-pulse")} />
      {network}
    </div>
  );
}
