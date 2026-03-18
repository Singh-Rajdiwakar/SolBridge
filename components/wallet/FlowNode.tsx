"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export function FlowNode({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "cyan" | "emerald" | "slate" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-400/20 bg-emerald-500/8"
      : tone === "cyan"
        ? "border-cyan-400/20 bg-cyan-500/8"
        : tone === "amber"
          ? "border-amber-400/20 bg-amber-500/8"
          : "border-white/10 bg-white/[0.03]";

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("rounded-lg border p-4 shadow-[0_14px_28px_rgba(0,0,0,0.22)]", toneClass)}
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <div className="mt-3 text-base font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{subtitle}</div>
    </motion.div>
  );
}
