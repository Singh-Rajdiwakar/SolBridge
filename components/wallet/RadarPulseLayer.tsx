"use client";

import { motion } from "framer-motion";

import { RADAR_PULSE_DURATION } from "@/components/wallet/address-radar-utils";

export function RadarPulseLayer({
  size,
  outerRadius,
  count = 4,
  reducedMotion = false,
}: {
  size: number;
  outerRadius: number;
  count?: number;
  reducedMotion?: boolean;
}) {
  const center = size / 2;
  const startRadius = size * 0.065;

  if (reducedMotion) {
    return (
      <g aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={outerRadius * 0.38}
          fill="none"
          stroke="rgba(74,222,128,0.12)"
          strokeWidth={1.4}
          filter="url(#radarPulseBlur)"
        />
      </g>
    );
  }

  return (
    <g aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <motion.circle
          key={`pulse-${index}`}
          cx={center}
          cy={center}
          r={startRadius}
          fill="none"
          stroke="rgba(74,222,128,0.34)"
          strokeWidth={1.8}
          filter="url(#radarPulseBlur)"
          animate={{
            r: [startRadius, outerRadius * 0.98],
            opacity: [0, 0.32, 0],
            strokeWidth: [1.8, 1.05],
          }}
          transition={{
            duration: RADAR_PULSE_DURATION,
            repeat: Number.POSITIVE_INFINITY,
            ease: [0.2, 0.68, 0.12, 1],
            delay: index * 0.56,
          }}
        />
      ))}
    </g>
  );
}
