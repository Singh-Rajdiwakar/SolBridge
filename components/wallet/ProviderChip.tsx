"use client";

import { Wallet } from "lucide-react";

import { cn } from "@/utils/cn";

export function ProviderChip({
  provider,
  active = true,
  className,
}: {
  provider: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm",
        active
          ? "border-[rgba(224,185,75,0.14)] bg-[rgba(255,255,255,0.03)] text-[#f6f3ed]"
          : "border-white/10 bg-white/[0.02] text-[#8e877b]",
        className,
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-[rgba(242,201,76,0.16)] bg-[rgba(242,201,76,0.08)] text-[10px] font-semibold text-[#f3d57c]">
        {provider.slice(0, 2).toUpperCase()}
      </div>
      <span className="font-medium">{provider}</span>
      <Wallet className="h-3.5 w-3.5 text-[#f2c94c]" />
    </div>
  );
}
