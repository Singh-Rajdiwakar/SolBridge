import type { ExplorerWalletGraph } from "@/types";

export type PositionedExplorerGraphNode = ExplorerWalletGraph["nodes"][number] & {
  x: number;
  y: number;
  radius: number;
};

export function buildWalletGraphLayout(graph: ExplorerWalletGraph, size = 360) {
  const center = size / 2;
  const orbitRadius = size * 0.32;
  const centerNode = graph.nodes.find((node) => node.role === "center");
  const outerNodes = graph.nodes.filter((node) => node.role !== "center");

  const positionedNodes: PositionedExplorerGraphNode[] = [];

  if (centerNode) {
    positionedNodes.push({
      ...centerNode,
      x: center,
      y: center,
      radius: 18,
    });
  }

  outerNodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(outerNodes.length, 1) - Math.PI / 2;
    const strength = Math.max(0.7, Math.min(1.4, 0.75 + node.interactionCount / 12));
    positionedNodes.push({
      ...node,
      x: center + Math.cos(angle) * orbitRadius,
      y: center + Math.sin(angle) * orbitRadius,
      radius: 9 + strength * 4,
    });
  });

  return {
    center,
    size,
    nodes: positionedNodes,
    edges: graph.edges.map((edge) => {
      const source = positionedNodes.find((node) => node.id === edge.source);
      const target = positionedNodes.find((node) => node.id === edge.target);

      return {
        ...edge,
        x1: source?.x || center,
        y1: source?.y || center,
        x2: target?.x || center,
        y2: target?.y || center,
      };
    }),
  };
}
