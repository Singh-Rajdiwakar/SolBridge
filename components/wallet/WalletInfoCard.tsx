"use client";

import { Copy, Download, Plus, QrCode, SendHorizontal, Wallet } from "lucide-react";

import { GlassCard, SectionHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/solana";
import { formatCurrency, formatNumber } from "@/utils/format";

export function WalletInfoCard({
  address,
  balanceSol,
  usdEstimate,
  providerName,
  network,
  connected,
  airdropLoading,
  onCopyAddress,
  onSend,
  onReceive,
  onAirdrop,
  onConnect,
  onExportKey,
}: {
  address: string | null;
  balanceSol: number;
  usdEstimate: number;
  providerName: string | null;
  network: string;
  connected: boolean;
  airdropLoading?: boolean;
  onCopyAddress: () => void;
  onSend: () => void;
  onReceive: () => void;
  onAirdrop: () => void;
  onConnect: () => void;
  onExportKey?: () => void;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Wallet Info"
        subtitle="Retix Wallet and connected Solana wallet session details."
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={connected ? "active" : "pending"} />
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              {network}
            </div>
          </div>
        }
      />

      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Wallet Name</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/15 bg-cyan-400/10">
                <Wallet className="h-4 w-4 text-cyan-300" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{providerName || "Retix Wallet"}</div>
                <div className="text-sm text-slate-400">{connected ? "Connected" : "Not connected"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Wallet Status</div>
            <div className="mt-3 text-lg font-semibold text-white">{connected ? "Connected" : "Idle"}</div>
            <div className="mt-1 text-sm text-slate-400">{network}</div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Address</div>
              <div className="mt-2 text-lg font-semibold text-white">{address ? shortenAddress(address) : "--"}</div>
              <div className="mt-1 text-sm text-slate-400 break-all">{address || "Connect or create a wallet to begin."}</div>
            </div>
            <Button variant="secondary" onClick={onCopyAddress} disabled={!address}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">SOL Balance</div>
            <div className="mt-3 text-3xl font-semibold text-white">{formatNumber(balanceSol, 4)}</div>
            <div className="mt-1 text-sm text-slate-400">{formatCurrency(usdEstimate)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Wallet Provider</div>
            <div className="mt-3 text-2xl font-semibold text-white">{providerName || "Retix Wallet"}</div>
            <div className="mt-1 text-sm text-slate-400">Solana Devnet</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {connected ? (
            <>
              <Button onClick={onSend}>
                <SendHorizontal className="h-4 w-4" />
                Send
              </Button>
              <Button variant="secondary" onClick={onReceive}>
                <QrCode className="h-4 w-4" />
                Receive
              </Button>
              <Button variant="secondary" onClick={onAirdrop} disabled={airdropLoading}>
                <Plus className="h-4 w-4" />
                {airdropLoading ? "Requesting..." : "Airdrop"}
              </Button>
              {onExportKey ? (
                <Button variant="secondary" onClick={onExportKey}>
                  <Download className="h-4 w-4" />
                  Export Key
                </Button>
              ) : null}
            </>
          ) : (
            <Button onClick={onConnect}>Connect Wallet</Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
