"use client";

import { LockKeyhole, ShieldAlert, ShieldCheck } from "lucide-react";

import { cn } from "@/utils/cn";

export function SecurityBadge({
  level = "secure",
  backedUp = true,
  className,
}: {
  level?: "secure" | "warning";
  backedUp?: boolean;
  className?: string;
}) {
  const secure = level === "secure" && backedUp;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
        secure
          ? "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
          : "border-amber-400/18 bg-amber-500/10 text-amber-200",
        className,
      )}
    >
      {secure ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
      <LockKeyhole className="h-3.5 w-3.5" />
      {secure ? "Encryption Enabled" : "Backup Reminder"}
    </div>
  );
}
