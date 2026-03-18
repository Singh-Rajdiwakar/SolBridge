"use client";

import { motion } from "framer-motion";

import {
  type PositionedInteractionNode,
  RADAR_SCAN_DURATION,
} from "@/components/wallet/address-radar-utils";

export function RadarConnectionLines({
  nodes,
  size,
  highlightedNodeId,
  reducedMotion = false,
}: {
  nodes: PositionedInteractionNode[];
  size: number;
  highlightedNodeId?: string | null;
  reducedMotion?: boolean;
}) {
  const center = size / 2;

  return (
    <g aria-hidden="true">
      {nodes.map((node) => {
        const baseOpacity = node.ghost ? 0.08 : 0.14 + node.strength * 0.18;
        const peakOpacity = node.ghost ? 0.14 : 0.26 + node.strength * 0.3;
        const scanDelay = (node.angleDegrees / 360) * RADAR_SCAN_DURATION;
        const highlighted = highlightedNodeId === node.id;

        return (
          <motion.line
            key={`line-${node.id}`}
            x1={center}
            y1={center}
            x2={node.x}
            y2={node.y}
            stroke={highlighted ? "rgba(103,232,249,0.72)" : "rgba(52,211,153,0.34)"}
            strokeWidth={highlighted ? 1.45 : 1.05}
            strokeDasharray={node.ghost ? "3 9" : "5 8"}
            filter={highlighted ? "url(#radarLineGlow)" : undefined}
            animate={
              reducedMotion
                ? { opacity: highlighted ? peakOpacity : baseOpacity }
                : {
                    opacity: [baseOpacity, highlighted ? peakOpacity + 0.12 : peakOpacity, baseOpacity],
                  }
            }
            transition={{
              duration: reducedMotion ? 0.2 : RADAR_SCAN_DURATION,
              repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: reducedMotion ? 0 : scanDelay,
            }}
          />
        );
      })}
    </g>
  );
}
