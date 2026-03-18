"use client";

import { ActivityNode } from "@/components/wallet/ActivityNode";
import type { PositionedInteractionNode } from "@/components/wallet/address-radar-utils";

export function RadarActivityNodes({
  nodes,
  highlightedNodeId,
  reducedMotion = false,
  showTooltips = true,
  onHover,
  onLeave,
}: {
  nodes: PositionedInteractionNode[];
  highlightedNodeId?: string | null;
  reducedMotion?: boolean;
  showTooltips?: boolean;
  onHover?: (node: PositionedInteractionNode) => void;
  onLeave?: () => void;
}) {
  return (
    <g>
      {nodes.map((node) => (
        <ActivityNode
          key={node.id}
          node={node}
          highlighted={highlightedNodeId === node.id}
          reducedMotion={reducedMotion}
          onHover={onHover}
          onLeave={onLeave}
          showTooltips={showTooltips}
        />
      ))}
    </g>
  );
}
