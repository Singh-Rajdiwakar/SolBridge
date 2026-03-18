"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { Radar } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import { EmptyStateBlock } from "@/components/wallet/EmptyStateBlock";
import { LiveStatusBadge } from "@/components/wallet/LiveStatusBadge";
import { RadarActivityNodes } from "@/components/wallet/RadarActivityNodes";
import { RadarCenterNode } from "@/components/wallet/RadarCenterNode";
import { RadarConnectionLines } from "@/components/wallet/RadarConnectionLines";
import { RadarGrid } from "@/components/wallet/RadarGrid";
import { RadarParticles } from "@/components/wallet/RadarParticles";
import { RadarPulseLayer } from "@/components/wallet/RadarPulseLayer";
import { RadarScannerArc } from "@/components/wallet/RadarScannerArc";
import { RadarTooltip } from "@/components/wallet/RadarTooltip";
import {
  autoPositionInteractions,
  buildInteractionsFromLegacyData,
  getGhostInteractions,
  mockRadarInteractions,
  type InteractionNode,
  type PositionedInteractionNode,
  RADAR_VIEWBOX_SIZE,
} from "@/components/wallet/address-radar-utils";
import type { AddressBookEntry, TransactionRecord } from "@/types";
import { cn } from "@/utils/cn";

type AddressInteractionRadarProps = {
  walletAddress?: string | null;
  address?: string | null;
  interactions?: InteractionNode[];
  entries?: AddressBookEntry[];
  transactions?: TransactionRecord[];
  isLive?: boolean;
  className?: string;
  size?: number;
  showTooltips?: boolean;
};

export function AddressInteractionRadar({
  walletAddress,
  address,
  interactions,
  entries = [],
  transactions = [],
  isLive = true,
  className,
  size = RADAR_VIEWBOX_SIZE,
  showTooltips = true,
}: AddressInteractionRadarProps) {
  const reducedMotion = useReducedMotion();
  const activeWalletAddress = walletAddress ?? address ?? null;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useSpring(mouseX, { stiffness: 80, damping: 18, mass: 0.4 });
  const parallaxY = useSpring(mouseY, { stiffness: 80, damping: 18, mass: 0.4 });
  const [highlightedNode, setHighlightedNode] = useState<PositionedInteractionNode | null>(null);

  const liveInteractions = useMemo(
    () => {
      if (interactions?.length) {
        return interactions;
      }

      const legacyInteractions = buildInteractionsFromLegacyData(entries, transactions);
      return legacyInteractions.length ? legacyInteractions : [];
    },
    [entries, interactions, transactions],
  );

  const positionedInteractions = useMemo(
    () => autoPositionInteractions(liveInteractions, size),
    [liveInteractions, size],
  );

  const hasRealInteractions = positionedInteractions.length > 0;
  const displayNodes = hasRealInteractions ? positionedInteractions : getGhostInteractions(size);
  const outerRadius = size * 0.41;

  if (!activeWalletAddress) {
    return (
      <GlassCard className={cn("h-full", className)}>
        <SectionHeader
          title="Address Interaction Radar"
          subtitle="Map peer wallets, transaction paths, and live contact signals around the active wallet."
          action={<Radar className="h-4 w-4 text-emerald-300" />}
        />
        <EmptyStateBlock
          title="No wallet connected"
          description="Connect a wallet to activate peer scan telemetry, address path detection, and live blockchain radar visuals."
          icon={<Radar className="h-5 w-5" />}
        />
      </GlassCard>
    );
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
    const offsetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;
    mouseX.set(offsetX);
    mouseY.set(offsetY);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHighlightedNode(null);
  };

  const signalCount = hasRealInteractions ? positionedInteractions.length : 0;
  const scanModeLabel = hasRealInteractions ? "Signals Active" : "Passive Listening";

  return (
    <GlassCard
      className={cn(
        "group relative h-full overflow-hidden border-cyan-400/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/18 hover:shadow-[0_30px_70px_rgba(2,12,27,0.44)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_72%_24%,rgba(34,197,94,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_36%)]" />

      <SectionHeader
        title="Address Interaction Radar"
        subtitle="A live wallet intelligence scanner visualizing peer proximity, mirrored transfer paths, and passive blockchain signals."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Signal Density</div>
              <div className="mt-1 text-sm font-semibold text-white">{signalCount || "Passive"}</div>
            </div>
            <LiveStatusBadge label={scanModeLabel} tone="success" />
          </div>
        }
      />

      <div
        className="relative overflow-hidden rounded-[1.35rem] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(8,14,28,0.96),rgba(5,10,20,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="wallet-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent_18%),radial-gradient(circle_at_center,rgba(59,130,246,0.11),transparent_48%),radial-gradient(circle_at_center,transparent_58%,rgba(4,8,18,0.58)_100%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] ring-1 ring-inset ring-white/5" />

        <motion.div
          className="relative mx-auto aspect-square w-full max-w-[34rem]"
          style={reducedMotion ? undefined : { x: parallaxX, y: parallaxY }}
        >
          <svg
            aria-label="Wallet interaction radar"
            className="h-full w-full"
            viewBox={`0 0 ${size} ${size}`}
            fill="none"
            role="img"
          >
            <defs>
              <radialGradient id="radarPanelGlow" cx="50%" cy="50%" r="68%">
                <stop offset="0%" stopColor="rgba(18,34,58,0.2)" />
                <stop offset="68%" stopColor="rgba(7,12,24,0.12)" />
                <stop offset="100%" stopColor="rgba(3,8,18,0)" />
              </radialGradient>
              <radialGradient id="radarCenterAura" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(52,211,153,0.22)" />
                <stop offset="52%" stopColor="rgba(34,211,238,0.12)" />
                <stop offset="100%" stopColor="rgba(34,211,238,0)" />
              </radialGradient>
              <radialGradient id="radarCenterCore" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#d9fbff" />
                <stop offset="55%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#2563eb" />
              </radialGradient>
              <radialGradient id="radarEdgeGlow" cx="50%" cy="50%" r="66%">
                <stop offset="0%" stopColor="rgba(34,197,94,0)" />
                <stop offset="88%" stopColor="rgba(34,197,94,0.05)" />
                <stop offset="100%" stopColor="rgba(34,197,94,0.1)" />
              </radialGradient>
              <linearGradient id="radarScannerSweep" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="rgba(110,231,183,0.55)" />
                <stop offset="55%" stopColor="rgba(34,197,94,0.18)" />
                <stop offset="100%" stopColor="rgba(34,197,94,0)" />
              </linearGradient>
              <linearGradient id="radarScannerBeam" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="rgba(167,243,208,0.9)" />
                <stop offset="52%" stopColor="rgba(74,222,128,0.24)" />
                <stop offset="100%" stopColor="rgba(34,197,94,0)" />
              </linearGradient>
              <linearGradient id="radarScannerEdge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(167,243,208,0.42)" />
                <stop offset="100%" stopColor="rgba(34,197,94,0)" />
              </linearGradient>
              <filter id="radarPulseBlur">
                <feGaussianBlur stdDeviation="1.4" />
              </filter>
              <filter id="radarScannerBlur">
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <filter id="radarCenterGlow">
                <feGaussianBlur stdDeviation="14" />
              </filter>
              <filter id="radarNodeGlow">
                <feGaussianBlur stdDeviation="4" />
              </filter>
              <filter id="radarParticleGlow">
                <feGaussianBlur stdDeviation="1.8" />
              </filter>
              <filter id="radarLineGlow">
                <feGaussianBlur stdDeviation="1.3" />
              </filter>
            </defs>

            <rect x="0" y="0" width={size} height={size} fill="url(#radarPanelGlow)" />

            <RadarGrid size={size} outerRadius={outerRadius} />
            <RadarConnectionLines
              nodes={displayNodes}
              size={size}
              highlightedNodeId={highlightedNode?.id}
              reducedMotion={Boolean(reducedMotion)}
            />
            <RadarPulseLayer size={size} outerRadius={outerRadius} count={4} reducedMotion={Boolean(reducedMotion)} />
            <RadarParticles size={size} reducedMotion={Boolean(reducedMotion)} />
            <RadarScannerArc size={size} outerRadius={outerRadius} reducedMotion={Boolean(reducedMotion)} />
            <RadarCenterNode walletAddress={activeWalletAddress} size={size} reducedMotion={Boolean(reducedMotion)} />
            <RadarActivityNodes
              nodes={displayNodes}
              highlightedNodeId={highlightedNode?.id}
              reducedMotion={Boolean(reducedMotion)}
              showTooltips={showTooltips}
              onHover={(node) => setHighlightedNode(node)}
              onLeave={() => setHighlightedNode(null)}
            />
          </svg>

          <AnimatePresence>
            {highlightedNode && showTooltips ? <RadarTooltip node={highlightedNode} size={size} /> : null}
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-5 top-5 flex items-start justify-between text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <div>
              <div className="text-slate-400">Peer Scan</div>
              <div className="mt-2 text-xs font-medium tracking-[0.18em] text-slate-300">
                {isLive ? "Live Devnet telemetry" : "Mirrored wallet telemetry"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400">Wallet Signals</div>
              <div className="mt-2 text-xs font-medium tracking-[0.18em] text-slate-300">
                {signalCount > 0 ? `${signalCount} verified peers` : "No active peers"}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-5 flex flex-col gap-4 border-t border-white/8 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">
              {hasRealInteractions ? `${signalCount} peer signals active` : "Awaiting wallet interaction signals"}
            </div>
            <div className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
              {hasRealInteractions
                ? "Scanner is tracking mirrored counterparties, trusted contacts, and recent flow routes around the active wallet."
                : "Network listening for peer activity and transfer paths. Radar remains armed so new counterparties surface instantly when on-chain activity is detected."}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[14rem]">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Scan State</div>
              <div className="mt-2 text-sm font-semibold text-white">{hasRealInteractions ? "Route mapped" : "Listening"}</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Telemetry</div>
              <div className="mt-2 text-sm font-semibold text-white">{isLive ? "Live feed" : "Cached mirror"}</div>
            </div>
          </div>
        </div>
      </div>

      {!hasRealInteractions && interactions?.length === 0 && entries.length === 0 && transactions.length === 0 ? (
        <div className="mt-4 hidden text-xs uppercase tracking-[0.18em] text-slate-500 sm:flex sm:items-center sm:justify-between">
          <span>Sample layout calibrated for wallet-first monitoring</span>
          <span>{mockRadarInteractions.length} demo peer nodes available for test mode</span>
        </div>
      ) : null}
    </GlassCard>
  );
}
