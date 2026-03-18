"use client";

import { motion } from "framer-motion";

import { RADAR_SCAN_DURATION } from "@/components/wallet/address-radar-utils";

export function RadarScannerArc({
  size,
  outerRadius,
  reducedMotion = false,
}: {
  size: number;
  outerRadius: number;
  reducedMotion?: boolean;
}) {
  const center = size / 2;
  const sweepRadius = outerRadius * 0.54;
  const sweepWidth = outerRadius * 0.92;
  const circumference = 2 * Math.PI * sweepRadius;
  const dashLength = circumference * 0.16;

  return (
    <motion.g
      aria-hidden="true"
      style={{ transformOrigin: `${center}px ${center}px` }}
      animate={reducedMotion ? undefined : { rotate: 360 }}
      transition={
        reducedMotion
          ? undefined
          : {
              duration: RADAR_SCAN_DURATION,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }
      }
    >
      <circle
        cx={center}
        cy={center}
        r={sweepRadius}
        fill="none"
        stroke="url(#radarScannerSweep)"
        strokeWidth={sweepWidth}
        strokeDasharray={`${dashLength} ${circumference}`}
        strokeLinecap="round"
        opacity={0.28}
        filter="url(#radarScannerBlur)"
      />
      <circle
        cx={center}
        cy={center}
        r={outerRadius * 0.92}
        fill="none"
        stroke="url(#radarScannerEdge)"
        strokeWidth={1.2}
        strokeDasharray={`${circumference * 0.085} ${circumference}`}
        strokeLinecap="round"
        opacity={0.5}
      />
      <line
        x1={center}
        y1={center}
        x2={center}
        y2={center - outerRadius * 0.92}
        stroke="url(#radarScannerBeam)"
        strokeWidth={1.15}
        strokeLinecap="round"
        opacity={0.7}
      />
    </motion.g>
  );
}
