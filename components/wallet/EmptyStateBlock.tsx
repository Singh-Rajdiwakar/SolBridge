"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { cn } from "@/utils/cn";

export function EmptyStateBlock({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(17,27,49,0.58),rgba(9,16,30,0.72))] p-6",
        className,
      )}
    >
      <div className="wallet-grid pointer-events-none absolute inset-0 opacity-50" />
      <motion.div
        className="pointer-events-none absolute inset-y-4 left-[-22%] w-1/3 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.1),transparent)] blur-2xl"
        animate={{ x: ["0%", "220%"] }}
        transition={{ duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -left-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[90px]"
        animate={{ opacity: [0.28, 0.5, 0.28], scale: [0.96, 1.08, 0.96] }}
        transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <div className="relative flex flex-col items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-400/18 bg-cyan-400/10 text-cyan-100 shadow-[inset_0_0_24px_rgba(34,211,238,0.1)]">
          {icon || <Sparkles className="h-5 w-5" />}
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="max-w-xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <div className="grid w-full gap-2 sm:max-w-md sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="relative overflow-hidden rounded-md border border-white/8 bg-white/[0.03] p-3"
              animate={{ opacity: [0.45, 0.8, 0.45] }}
              transition={{ duration: 2.8, delay: index * 0.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <div className="h-2 w-14 rounded-full bg-white/10" />
              <div className="mt-3 h-2 w-full rounded-full bg-white/5" />
              <div className="mt-2 h-2 w-3/4 rounded-full bg-white/5" />
            </motion.div>
          ))}
        </div>
        <div className="relative h-16 w-full overflow-hidden rounded-md border border-white/8 bg-white/[0.02]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(120,170,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(120,170,255,0.05)_1px,transparent_1px)] bg-[size:18px_18px]" />
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <motion.path
              d="M0,72 C14,66 22,74 34,60 C44,46 56,58 68,42 C78,30 86,38 100,28"
              fill="none"
              stroke="rgba(34,211,238,0.42)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0.12, opacity: 0.2 }}
              animate={{ pathLength: [0.12, 1, 0.12], opacity: [0.2, 0.58, 0.2] }}
              transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          </svg>
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
