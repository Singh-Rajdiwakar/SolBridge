"use client";

import { motion } from "framer-motion";

import { cn } from "@/utils/cn";

const toneStyles = {
  success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
  info: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  warning: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  danger: "border-rose-400/20 bg-rose-500/10 text-rose-100",
} as const;

const dotStyles = {
  success: "bg-emerald-400 shadow-[0_0_14px_rgba(34,197,94,0.72)]",
  info: "bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.72)]",
  warning: "bg-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.68)]",
  danger: "bg-rose-400 shadow-[0_0_14px_rgba(239,68,68,0.72)]",
} as const;

export function LiveStatusBadge({
  label,
  detail,
  tone = "success",
  pulse = true,
  className,
}: {
  label: string;
  detail?: string;
  tone?: keyof typeof toneStyles;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
        toneStyles[tone],
        className,
      )}
    >
      <div className="relative flex h-2.5 w-2.5 items-center justify-center">
        {pulse ? (
          <motion.span
            className={cn("absolute inset-0 rounded-full opacity-30", dotStyles[tone])}
            animate={{ scale: [1, 1.9, 1], opacity: [0.24, 0, 0.24] }}
            transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
          />
        ) : null}
        <span className={cn("relative h-2.5 w-2.5 rounded-full", dotStyles[tone])} />
      </div>
      <span>{label}</span>
      {detail ? <span className="text-[10px] tracking-[0.16em] text-current/70">{detail}</span> : null}
    </div>
  );
}
