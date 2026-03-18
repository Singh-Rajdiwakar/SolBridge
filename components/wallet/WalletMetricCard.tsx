"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/utils/cn";

const accentStyles = {
  blue: "from-blue-500/18 via-cyan-400/10 to-transparent border-cyan-400/16",
  green: "from-emerald-500/18 via-emerald-400/10 to-transparent border-emerald-400/16",
  amber: "from-amber-500/18 via-amber-400/10 to-transparent border-amber-400/16",
  neutral: "from-white/10 via-white/[0.03] to-transparent border-white/10",
} as const;

export function WalletMetricCard({
  label,
  value,
  description,
  icon,
  accent = "blue",
  className,
}: {
  label: string;
  value: ReactNode;
  description: string;
  icon?: ReactNode;
  accent?: keyof typeof accentStyles;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-4 shadow-[0_18px_44px_rgba(2,8,20,0.24)]",
        accentStyles[accent],
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
        {icon ? <div className="text-slate-300 transition group-hover:text-white">{icon}</div> : null}
      </div>
      <div className="mt-3 text-xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{description}</div>
    </motion.div>
  );
}
