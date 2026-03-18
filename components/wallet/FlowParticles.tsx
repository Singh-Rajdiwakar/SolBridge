"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export function FlowParticles({
  active,
  surge,
  tone = "cyan",
}: {
  active: boolean;
  surge?: boolean;
  tone?: "cyan" | "emerald" | "amber";
}) {
  if (!active) {
    return null;
  }

  const particleClass =
    tone === "emerald"
      ? "bg-emerald-300 shadow-[0_0_14px_rgba(34,197,94,0.6)]"
      : tone === "amber"
        ? "bg-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.56)]"
        : "bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.62)]";

  return (
    <>
      {[0, 1, 2, 3].map((index) => (
        <motion.span
          key={index}
          className={cn("absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full", particleClass)}
          animate={{ x: ["0%", "100%"], opacity: [0, 1, 0], scale: surge ? [0.8, 1.35, 0.8] : [0.72, 1.05, 0.72] }}
          transition={{
            duration: surge ? 1.2 : 2.4,
            delay: index * 0.22,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}
