"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Radar } from "lucide-react";

import { EmptyState, GlassCard, SectionHeader } from "@/components/shared";
import type { AddressBookEntry, TransactionRecord } from "@/types";
import { shortenAddress } from "@/lib/solana";

type RadarNode = {
  id: string;
  label: string;
  address: string;
  top: string;
  left: string;
};

export function AddressRadar({
  address,
  entries,
  transactions,
}: {
  address?: string | null;
  entries: AddressBookEntry[];
  transactions: TransactionRecord[];
}) {
  const nodes = useMemo<RadarNode[]>(() => {
    const peers = new Map<string, string>();

    entries.forEach((entry) => {
      peers.set(entry.address, entry.name);
    });

    transactions.forEach((transaction) => {
      if (transaction.receiver && !peers.has(transaction.receiver)) {
        peers.set(transaction.receiver, shortenAddress(transaction.receiver));
      }
    });

    const positions = [
      { top: "14%", left: "50%" },
      { top: "30%", left: "82%" },
      { top: "72%", left: "74%" },
      { top: "78%", left: "25%" },
      { top: "34%", left: "18%" },
    ];

    return Array.from(peers.entries())
      .slice(0, positions.length)
      .map(([peerAddress, label], index) => ({
        id: `${peerAddress}-${index}`,
        label,
        address: peerAddress,
        top: positions[index].top,
        left: positions[index].left,
      }));
  }, [entries, transactions]);

  return (
    <GlassCard>
      <SectionHeader
        title="Address Radar"
        subtitle="Interaction map around the active wallet, showing trusted contacts and recent counterparties."
        action={<Radar className="h-4 w-4 text-cyan-300" />}
      />

      {!address ? (
        <EmptyState title="No wallet connected" description="Connect a wallet to map counterparties and transaction links." />
      ) : nodes.length === 0 ? (
        <EmptyState title="No address interactions yet" description="Saved contacts and wallet transfers will appear on the radar once activity begins." />
      ) : (
        <div className="relative h-[24rem] overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1),transparent_38%),linear-gradient(180deg,rgba(12,18,32,0.82),rgba(7,12,24,0.94))]">
          <div className="absolute inset-[12%] rounded-full border border-cyan-400/10" />
          <div className="absolute inset-[26%] rounded-full border border-cyan-400/8" />
          <div className="absolute inset-[40%] rounded-full border border-cyan-400/6" />

          <svg className="absolute inset-0 h-full w-full">
            {nodes.map((node) => (
              <line
                key={`line-${node.id}`}
                x1="50%"
                y1="50%"
                x2={node.left}
                y2={node.top}
                stroke="rgba(59,130,246,0.28)"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          <motion.div
            className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-400/24 bg-[rgba(8,16,28,0.96)] shadow-[0_0_50px_rgba(34,211,238,0.18)]"
            animate={{ boxShadow: ["0 0 30px rgba(59,130,246,0.14)", "0 0 52px rgba(34,211,238,0.22)", "0 0 30px rgba(59,130,246,0.14)"] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Wallet</div>
            <div className="mt-1 text-xs font-semibold text-white">{shortenAddress(address)}</div>
          </motion.div>

          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, delay: index * 0.06 }}
              className="absolute z-10 w-32 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-[rgba(10,16,32,0.9)] px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.34)]"
              style={{ top: node.top, left: node.left }}
            >
              <div className="text-xs font-semibold text-white">{node.label}</div>
              <div className="mt-1 truncate text-[11px] uppercase tracking-[0.16em] text-slate-500">{shortenAddress(node.address)}</div>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
