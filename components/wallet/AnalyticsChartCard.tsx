"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/utils/cn";

export function AnalyticsChartCard({
  title,
  subtitle,
  metric,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  metric?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 shadow-[0_24px_52px_rgba(2,8,20,0.22)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_45%)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{subtitle}</div>
          </div>
          {metric ? <div className="text-right text-sm font-semibold text-cyan-100">{metric}</div> : null}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </motion.div>
  );
}
