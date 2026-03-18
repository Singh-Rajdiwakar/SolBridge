"use client";

import { motion } from "framer-motion";

import {
  formatInteractionAmount,
  formatInteractionTime,
  type PositionedInteractionNode,
} from "@/components/wallet/address-radar-utils";
import { shortenAddress } from "@/lib/solana";

export function RadarTooltip({
  node,
  size,
}: {
  node: PositionedInteractionNode;
  size: number;
}) {
  const amount = formatInteractionAmount(node.amount);
  const statusLabel = node.status === "warning" ? "Watch" : node.status === "idle" ? "Idle" : "Active";
  const left = `${(node.x / size) * 100}%`;
  const top = `${(node.y / size) * 100}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="pointer-events-none absolute z-20 w-52 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,32,0.96),rgba(6,10,20,0.98))] px-4 py-3 text-left shadow-[0_18px_38px_rgba(0,0,0,0.42)] backdrop-blur-xl"
      style={{
        left,
        top,
        transform: "translate(-50%, calc(-100% - 18px))",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{node.label}</div>
        <div className="rounded-full border border-emerald-400/16 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200">
          {statusLabel}
        </div>
      </div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {shortenAddress(node.address)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-400">
        <div>
          <div className="uppercase tracking-[0.16em] text-slate-500">Signal</div>
          <div className="mt-1 font-medium text-slate-200">{Math.round(node.strength * 100)}%</div>
        </div>
        <div>
          <div className="uppercase tracking-[0.16em] text-slate-500">Last Seen</div>
          <div className="mt-1 font-medium text-slate-200">{formatInteractionTime(node.lastSeen)}</div>
        </div>
        <div className="col-span-2">
          <div className="uppercase tracking-[0.16em] text-slate-500">Flow Volume</div>
          <div className="mt-1 font-medium text-slate-200">
            {amount ? `${amount} SOL mirrored` : "Awaiting mirrored transfer data"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
