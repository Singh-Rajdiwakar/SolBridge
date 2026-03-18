"use client";

import { motion } from "framer-motion";

import {
  type PositionedInteractionNode,
  RADAR_SCAN_DURATION,
} from "@/components/wallet/address-radar-utils";

type ActivityNodeProps = {
  node: PositionedInteractionNode;
  highlighted?: boolean;
  reducedMotion?: boolean;
  onHover?: (node: PositionedInteractionNode) => void;
  onLeave?: () => void;
  showTooltips?: boolean;
};

const statusColorMap = {
  active: {
    fill: "#67e8f9",
    glow: "rgba(34,211,238,0.55)",
    ring: "rgba(34,197,94,0.38)",
  },
  idle: {
    fill: "#34d399",
    glow: "rgba(52,211,153,0.38)",
    ring: "rgba(52,211,153,0.24)",
  },
  warning: {
    fill: "#f59e0b",
    glow: "rgba(245,158,11,0.45)",
    ring: "rgba(245,158,11,0.26)",
  },
} as const;

export function ActivityNode({
  node,
  highlighted = false,
  reducedMotion = false,
  onHover,
  onLeave,
  showTooltips = true,
}: ActivityNodeProps) {
  const colors = statusColorMap[node.status];
  const baseRadius = 3.6 + node.strength * 3;
  const hoverRadius = baseRadius + 1.4;
  const scanDelay = (node.angleDegrees / 360) * RADAR_SCAN_DURATION;
  const opacity = node.ghost ? 0.24 : 0.92;

  return (
    <motion.g
      role={showTooltips ? "button" : undefined}
      tabIndex={showTooltips && !node.ghost ? 0 : -1}
      className="cursor-pointer"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity, scale: highlighted ? 1.08 : 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      onHoverStart={() => {
        if (!node.ghost) {
          onHover?.(node);
        }
      }}
      onHoverEnd={onLeave}
      onFocus={() => {
        if (!node.ghost) {
          onHover?.(node);
        }
      }}
      onBlur={onLeave}
      onClick={() => {
        if (!node.ghost) {
          onHover?.(node);
        }
      }}
    >
      <title>{node.ghost ? "Ghost interaction placeholder" : `${node.label} ${node.address}`}</title>

      <motion.circle
        cx={node.x}
        cy={node.y}
        r={baseRadius * 2.4}
        fill={colors.glow}
        filter="url(#radarNodeGlow)"
        animate={
          reducedMotion
            ? { opacity: highlighted ? 0.26 : 0.16 }
            : {
                opacity: [0.08, highlighted ? 0.42 : 0.2, 0.08],
                r: [baseRadius * 1.8, baseRadius * 2.8, baseRadius * 1.8],
              }
        }
        transition={{
          duration: reducedMotion ? 0.2 : RADAR_SCAN_DURATION,
          repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : scanDelay,
        }}
      />

      <motion.circle
        cx={node.x}
        cy={node.y}
        r={baseRadius * 1.5}
        fill="none"
        stroke={colors.ring}
        strokeWidth={1.2}
        animate={
          reducedMotion
            ? { opacity: highlighted ? 0.7 : 0.3 }
            : {
                opacity: [0.22, highlighted ? 0.82 : 0.48, 0.22],
                r: [baseRadius * 1.15, baseRadius * 1.9, baseRadius * 1.15],
              }
        }
        transition={{
          duration: reducedMotion ? 0.2 : 2.8,
          repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : scanDelay * 0.18,
        }}
      />

      <motion.circle
        cx={node.x}
        cy={node.y}
        r={highlighted ? hoverRadius : baseRadius}
        fill={colors.fill}
        stroke="rgba(255,255,255,0.86)"
        strokeWidth={highlighted ? 1.6 : 1}
        filter="url(#radarNodeGlow)"
        animate={
          reducedMotion
            ? { opacity: node.ghost ? 0.3 : 0.92 }
            : {
                opacity: [node.ghost ? 0.18 : 0.72, highlighted ? 1 : 0.9, node.ghost ? 0.18 : 0.72],
              }
        }
        transition={{
          duration: reducedMotion ? 0.2 : 2.4,
          repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : scanDelay * 0.22,
        }}
      />
    </motion.g>
  );
}
