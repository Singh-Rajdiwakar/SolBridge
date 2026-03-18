"use client";

import { motion } from "framer-motion";

import { shortenAddress } from "@/lib/solana";

export function RadarCenterNode({
  walletAddress,
  size,
  reducedMotion = false,
}: {
  walletAddress: string;
  size: number;
  reducedMotion?: boolean;
}) {
  const center = size / 2;

  return (
    <g aria-label={`Wallet origin ${walletAddress}`}>
      <motion.circle
        cx={center}
        cy={center}
        r={48}
        fill="url(#radarCenterAura)"
        filter="url(#radarCenterGlow)"
        animate={
          reducedMotion
            ? { opacity: 0.44 }
            : {
                opacity: [0.26, 0.48, 0.26],
                r: [42, 50, 42],
              }
        }
        transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.g
        style={{ transformOrigin: `${center}px ${center}px` }}
        animate={reducedMotion ? undefined : { scale: [0.985, 1.035, 0.985] }}
        transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <circle
          cx={center}
          cy={center}
          r={24}
          fill="rgba(7,16,31,0.94)"
          stroke="rgba(125,211,252,0.26)"
          strokeWidth={1.2}
        />
        <circle
          cx={center}
          cy={center}
          r={12.5}
          fill="url(#radarCenterCore)"
          filter="url(#radarNodeGlow)"
        />
        <circle
          cx={center}
          cy={center}
          r={3.2}
          fill="rgba(236,254,255,0.96)"
        />
      </motion.g>

      <text
        x={center}
        y={center + 42}
        textAnchor="middle"
        fontSize="11"
        letterSpacing="0.18em"
        fill="rgba(148,163,184,0.72)"
      >
        WALLET ORIGIN
      </text>
      <text
        x={center}
        y={center + 60}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill="rgba(234,242,255,0.96)"
      >
        {shortenAddress(walletAddress)}
      </text>
    </g>
  );
}
