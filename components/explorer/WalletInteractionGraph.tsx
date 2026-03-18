"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Network, SearchCode } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import { buildWalletGraphLayout } from "@/lib/solana/graphBuilder";
import { shortenExplorerValue } from "@/lib/solana/txParser";
import type { ExplorerWalletGraph } from "@/types";

export function WalletInteractionGraph({
  graph,
  onNodeSelect,
}: {
  graph?: ExplorerWalletGraph | null;
  onNodeSelect?: (address: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const layout = useMemo(() => (graph ? buildWalletGraphLayout(graph, 360) : null), [graph]);
  const hoveredNode = layout?.nodes.find((node) => node.id === hoveredNodeId) || null;

  return (
    <GlassCard className="space-y-4">
      <SectionHeader
        title="Wallet Interaction Graph"
        subtitle="Counterparty map built from recent on-chain signatures and mirrored activity."
        action={<Network className="h-4 w-4 text-cyan-300" />}
      />

      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_58%),linear-gradient(180deg,rgba(17,27,49,0.82),rgba(7,12,24,0.95))] p-4">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(120,170,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(120,170,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />

        {layout ? (
          <div className="relative mx-auto aspect-square w-full max-w-[360px]">
            <svg viewBox={`0 0 ${layout.size} ${layout.size}`} className="h-full w-full">
              <defs>
                <filter id="wallet-graph-glow">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {[0.24, 0.39, 0.54].map((ratio) => (
                <circle
                  key={ratio}
                  cx={layout.center}
                  cy={layout.center}
                  r={layout.size * ratio}
                  fill="none"
                  stroke="rgba(120,170,255,0.08)"
                  strokeDasharray="5 7"
                />
              ))}

              {layout.edges.map((edge) => (
                <motion.line
                  key={edge.id}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId) ? "rgba(34,211,238,0.85)" : "rgba(120,170,255,0.22)"}
                  strokeWidth={Math.max(1.2, Math.min(4, edge.txCount * 0.45))}
                  strokeDasharray="3 7"
                  initial={{ pathLength: 0.3, opacity: 0.28 }}
                  animate={
                    prefersReducedMotion
                      ? { opacity: 0.5 }
                      : { pathLength: [0.3, 1, 0.3], opacity: [0.2, 0.65, 0.2] }
                  }
                  transition={{
                    duration: 4.8,
                    repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {layout.nodes.map((node, index) => {
                const active = hoveredNodeId === node.id;
                const isCenter = node.role === "center";
                return (
                  <motion.g
                    key={node.id}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={() => node.address && onNodeSelect?.(node.address)}
                    className={node.address ? "cursor-pointer" : ""}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={
                      prefersReducedMotion
                        ? { opacity: 1, scale: 1 }
                        : {
                            opacity: 1,
                            scale: active ? 1.08 : isCenter ? [1, 1.04, 1] : [1, 1.02, 1],
                          }
                    }
                    transition={{
                      delay: index * 0.04,
                      duration: isCenter ? 3.4 : 4.2,
                      repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    {isCenter ? (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.radius + 12}
                        fill="rgba(34,211,238,0.12)"
                        filter="url(#wallet-graph-glow)"
                      />
                    ) : null}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius}
                      fill={isCenter ? "rgba(59,130,246,0.92)" : "rgba(34,211,238,0.78)"}
                      stroke={isCenter ? "rgba(191,219,254,0.9)" : "rgba(186,230,253,0.55)"}
                      strokeWidth={isCenter ? 2.5 : 1.8}
                      filter="url(#wallet-graph-glow)"
                    />
                  </motion.g>
                );
              })}
            </svg>

            {hoveredNode ? (
              <div className="pointer-events-none absolute right-2 top-2 max-w-[220px] rounded-lg border border-cyan-300/20 bg-[rgba(10,16,32,0.94)] p-3 shadow-[0_20px_80px_rgba(0,0,0,0.42)]">
                <div className="text-sm font-semibold text-white">{hoveredNode.label}</div>
                <div className="mt-1 font-mono text-xs text-slate-500">{shortenExplorerValue(hoveredNode.address, 10, 8)}</div>
                <div className="mt-3 text-xs text-slate-300">
                  {hoveredNode.interactionCount} interactions • value {hoveredNode.value.toFixed(2)}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
              <SearchCode className="h-6 w-6" />
            </div>
            <div className="text-lg font-semibold text-white">Graph unavailable</div>
            <div className="max-w-sm text-sm text-slate-400">
              Search a wallet address to render counterparty relationships and recent interaction paths.
            </div>
          </div>
        )}
      </div>

      {graph?.legends?.length ? (
        <div className="flex flex-wrap gap-2">
          {graph.legends.map((legend) => (
            <div key={legend.label} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              {legend.label}
            </div>
          ))}
          {hoveredNode?.explorerUrl ? (
            <a
              href={hoveredNode.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
            >
              Open hovered node
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  );
}
