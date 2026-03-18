"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { cn } from "@/utils/cn";

export function PremiumEmptyChartState({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,34,0.94),rgba(7,12,24,0.98))] p-5",
        className,
      )}
    >
      <div className="wallet-grid pointer-events-none absolute inset-0 opacity-40" />
      <motion.div
        className="pointer-events-none absolute inset-y-4 left-[-20%] w-1/3 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.12),transparent)] blur-2xl"
        animate={{ x: ["0%", "200%"] }}
        transition={{ duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <div className="relative space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-400/16 bg-cyan-400/10 text-cyan-100">
            {icon || <Sparkles className="h-5 w-5" />}
          </div>
          <div className="space-y-2">
            <div className="text-base font-semibold text-white">{title}</div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">{description}</p>
          </div>
        </div>

        <div className="relative h-28 overflow-hidden rounded-lg border border-white/8 bg-white/[0.03]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(120,170,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(120,170,255,0.06)_1px,transparent_1px)] bg-[size:26px_26px]" />
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <motion.path
              d="M0,70 C12,62 20,72 32,56 C42,42 54,58 66,40 C75,27 86,39 100,26"
              fill="none"
              stroke="rgba(59,130,246,0.45)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0.1, opacity: 0.18 }}
              animate={{ pathLength: [0.1, 1, 0.1], opacity: [0.18, 0.5, 0.18] }}
              transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          </svg>
          <motion.div
            className="absolute inset-y-2 left-0 w-20 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]"
            animate={{ x: ["-30%", "520%"] }}
            transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
