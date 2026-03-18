"use client";

import { memo } from "react";

import { RADAR_RING_COUNT } from "@/components/wallet/address-radar-utils";

export const RadarGrid = memo(function RadarGrid({
  size,
  outerRadius,
}: {
  size: number;
  outerRadius: number;
}) {
  const center = size / 2;
  const ringFractions = Array.from({ length: RADAR_RING_COUNT }, (_, index) => (index + 1) / RADAR_RING_COUNT);
  const tickAngles = Array.from({ length: 24 }, (_, index) => index * 15);

  return (
    <g aria-hidden="true">
      <circle cx={center} cy={center} r={outerRadius + 10} fill="url(#radarEdgeGlow)" opacity="0.28" />

      {ringFractions.map((fraction, index) => (
        <circle
          key={`ring-${fraction}`}
          cx={center}
          cy={center}
          r={outerRadius * fraction}
          fill="none"
          stroke={index === ringFractions.length - 1 ? "rgba(125,211,252,0.12)" : "rgba(125,211,252,0.08)"}
          strokeWidth={1}
        />
      ))}

      <line
        x1={center}
        y1={center - outerRadius}
        x2={center}
        y2={center + outerRadius}
        stroke="rgba(148,163,184,0.14)"
        strokeWidth={1}
      />
      <line
        x1={center - outerRadius}
        y1={center}
        x2={center + outerRadius}
        y2={center}
        stroke="rgba(148,163,184,0.14)"
        strokeWidth={1}
      />

      {tickAngles.map((angle) => {
        const radians = ((angle - 90) * Math.PI) / 180;
        const inner = outerRadius - 8;
        const outer = outerRadius + (angle % 45 === 0 ? 6 : 2);
        const x1 = center + inner * Math.cos(radians);
        const y1 = center + inner * Math.sin(radians);
        const x2 = center + outer * Math.cos(radians);
        const y2 = center + outer * Math.sin(radians);

        return (
          <line
            key={`tick-${angle}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(125,211,252,0.12)"
            strokeWidth={angle % 45 === 0 ? 1.1 : 0.8}
          />
        );
      })}

      <path
        d={`M ${center - outerRadius * 0.82} ${center + outerRadius * 0.48} Q ${center} ${center + outerRadius * 0.18} ${center + outerRadius * 0.86} ${center + outerRadius * 0.52}`}
        fill="none"
        stroke="rgba(52,211,153,0.08)"
        strokeWidth={1}
        strokeDasharray="6 10"
      />
      <path
        d={`M ${center - outerRadius * 0.72} ${center - outerRadius * 0.58} Q ${center - outerRadius * 0.18} ${center - outerRadius * 0.2} ${center + outerRadius * 0.76} ${center - outerRadius * 0.62}`}
        fill="none"
        stroke="rgba(96,165,250,0.08)"
        strokeWidth={1}
        strokeDasharray="5 9"
      />
    </g>
  );
});
