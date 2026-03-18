"use client";

import type { AddressBookEntry, TransactionRecord } from "@/types";
import { shortenAddress } from "@/lib/solana";

export const RADAR_VIEWBOX_SIZE = 440;
export const RADAR_RING_COUNT = 5;
export const RADAR_SCAN_DURATION = 18;
export const RADAR_PULSE_DURATION = 2.6;

export type InteractionNode = {
  id: string;
  address: string;
  label?: string;
  strength?: number;
  status?: "active" | "idle" | "warning";
  x?: number;
  y?: number;
  amount?: number;
  lastSeen?: string;
  ghost?: boolean;
};

export type PositionedInteractionNode = InteractionNode & {
  label: string;
  strength: number;
  status: "active" | "idle" | "warning";
  x: number;
  y: number;
  angleDegrees: number;
  radius: number;
  ghost: boolean;
};

export const mockRadarInteractions: InteractionNode[] = [
  {
    id: "peer-lp-vault",
    address: "9LhWtyStjzPE6wgjJvCoPErFp2d3sC65L8pB4nV6r2NA",
    label: "LP Vault",
    strength: 0.92,
    status: "active",
    amount: 18.2,
    lastSeen: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: "peer-governance",
    address: "Bz3LtuuJ23m1TtyvE7Tj4ik2o4w1GWv4Uv8m9ewY2R3d",
    label: "Gov Delegate",
    strength: 0.78,
    status: "active",
    amount: 6.4,
    lastSeen: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "peer-market-maker",
    address: "EfQ1z1E8W2PSgFa9ZLTmoyjQbqEo3WFTQQ3m1mQH2x7H",
    label: "Liquidity Route",
    strength: 0.68,
    status: "idle",
    amount: 2.9,
    lastSeen: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "peer-warning",
    address: "6x9rWvJ5oQ8NY2ZUwG5v3aRhkgTQgCkqnz9h8VQZP7ut",
    label: "Unverified Sink",
    strength: 0.54,
    status: "warning",
    amount: 1.2,
    lastSeen: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
];

export function polarToCartesian(cx: number, cy: number, radius: number, angleDegrees: number) {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function resolveCoordinate(value: number | undefined, size: number) {
  if (typeof value !== "number") {
    return undefined;
  }

  if (value >= 0 && value <= 100) {
    return (value / 100) * size;
  }

  return value;
}

function clampStrength(value?: number) {
  return Math.min(1, Math.max(0.28, value ?? 0.62));
}

export function autoPositionInteractions(
  interactions: InteractionNode[],
  size = RADAR_VIEWBOX_SIZE,
): PositionedInteractionNode[] {
  const center = size / 2;
  const outerRadius = size * 0.39;
  const ringPattern = [0.46, 0.58, 0.72, 0.82];

  return interactions.slice(0, 8).map((interaction, index, source) => {
    const total = Math.max(source.length, 1);
    const spread = 360 / total;
    const angleDegrees = (index * spread + (index % 2 === 0 ? -12 : 10) + 360) % 360;
    const radius = outerRadius * ringPattern[index % ringPattern.length];
    const autoPoint = polarToCartesian(center, center, radius, angleDegrees);
    const resolvedX = resolveCoordinate(interaction.x, size) ?? autoPoint.x;
    const resolvedY = resolveCoordinate(interaction.y, size) ?? autoPoint.y;

    return {
      ...interaction,
      label: interaction.label || shortenAddress(interaction.address),
      strength: clampStrength(interaction.strength),
      status: interaction.status || "active",
      x: resolvedX,
      y: resolvedY,
      angleDegrees,
      radius,
      ghost: Boolean(interaction.ghost),
    };
  });
}

export function buildInteractionsFromLegacyData(
  entries: AddressBookEntry[] = [],
  transactions: TransactionRecord[] = [],
): InteractionNode[] {
  const peerMap = new Map<string, InteractionNode>();

  entries.forEach((entry, index) => {
    peerMap.set(entry.address, {
      id: `entry-${entry.address}`,
      address: entry.address,
      label: entry.name,
      strength: Math.max(0.48, 0.84 - index * 0.06),
      status: "active",
      lastSeen: entry.lastUsedAt || entry.createdAt,
    });
  });

  transactions.forEach((transaction, index) => {
    if (!transaction.receiver) {
      return;
    }

    const current = peerMap.get(transaction.receiver);
    const warningRisk = transaction.riskLevel?.toLowerCase().includes("risk");
    const baseStrength = Math.max(0.32, 0.78 - index * 0.04);

    peerMap.set(transaction.receiver, {
      id: current?.id || `tx-${transaction.receiver}`,
      address: transaction.receiver,
      label: current?.label || shortenAddress(transaction.receiver),
      strength: Math.max(current?.strength || 0, baseStrength),
      status: warningRisk ? "warning" : current?.status || "active",
      amount: transaction.amount,
      lastSeen: transaction.createdAt,
    });
  });

  return Array.from(peerMap.values());
}

export function getGhostInteractions(size = RADAR_VIEWBOX_SIZE): PositionedInteractionNode[] {
  const ghostNodes = autoPositionInteractions(
    [
      {
        id: "ghost-west",
        address: "ghost-west",
        label: "Ghost Relay",
        strength: 0.34,
        status: "idle",
        x: 24,
        y: 66,
        ghost: true,
      },
      {
        id: "ghost-north",
        address: "ghost-north",
        label: "Cold Path",
        strength: 0.28,
        status: "idle",
        x: 68,
        y: 20,
        ghost: true,
      },
      {
        id: "ghost-east",
        address: "ghost-east",
        label: "Awaiting Signal",
        strength: 0.32,
        status: "idle",
        x: 78,
        y: 62,
        ghost: true,
      },
    ],
    size,
  );

  return ghostNodes.map((node) => ({ ...node, ghost: true }));
}

export function formatInteractionAmount(amount?: number) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return null;
  }

  return amount.toLocaleString(undefined, {
    maximumFractionDigits: amount < 10 ? 3 : 2,
  });
}

export function formatInteractionTime(value?: string) {
  if (!value) {
    return "Listening";
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return timestamp.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
