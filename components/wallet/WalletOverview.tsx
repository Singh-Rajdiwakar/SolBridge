"use client";

import { AlertTriangle, ArrowLeftRight, Copy, Download, Plus, QrCode, SendHorizontal, Wallet } from "lucide-react";

import { GlassCard, SectionHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/solana";
import { formatCurrency, formatNumber } from "@/utils/format";

export function WalletOverview({
  address,
  balanceSol,
  usdEstimate,
  providerName,
  network,
  connected,
  airdropLoading,
  lowBalance,
  onCopyAddress,
  onSend,
  onReceive,
  onSwap,
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
  lowBalance?: boolean;
  onCopyAddress: () => void;
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
  onAirdrop: () => void;
  onConnect: () => void;
  onExportKey?: () => void;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Wallet Overview"
        subtitle="Retix Wallet behaves like an internal Solana Devnet wallet for transfers, swaps, minting, and asset management."
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={connected ? "active" : "pending"} />
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              {network}
            </div>
          </div>
        }
      />

      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Wallet Name</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-cyan-400/15 bg-cyan-400/10">
                    <Wallet className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{providerName || "Retix Wallet"}</div>
                    <div className="text-sm text-slate-400">{connected ? "Connected session" : "Create or connect a wallet"}</div>
                  </div>
                </div>
              </div>
              {onExportKey ? (
                <Button variant="secondary" onClick={onExportKey}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">SOL Balance</div>
            <div className="mt-3 text-3xl font-semibold text-white">{formatNumber(balanceSol, 4)}</div>
            <div className="mt-1 text-sm text-slate-400">{formatCurrency(usdEstimate)}</div>
            <div className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">Wallet Provider</div>
            <div className="mt-1 text-sm text-slate-300">{providerName || "Retix Wallet"} on Solana Devnet</div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Wallet Address</div>
              <div className="mt-2 text-lg font-semibold text-white">{address ? shortenAddress(address) : "--"}</div>
              <div className="mt-1 break-all text-sm text-slate-400">{address || "Connect or create a wallet to begin."}</div>
            </div>
            <Button variant="secondary" onClick={onCopyAddress} disabled={!address}>
              <Copy className="h-4 w-4" />
              Copy Address
            </Button>
          </div>
        </div>

        {lowBalance ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400/15 bg-amber-500/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              Low balance detected. Request a Devnet airdrop before sending SOL or paying mint fees.
            </div>
          </div>
        ) : null}

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
              <Button variant="secondary" onClick={onSwap}>
                <ArrowLeftRight className="h-4 w-4" />
                Swap
              </Button>
              <Button variant="secondary" onClick={onAirdrop} disabled={airdropLoading}>
                <Plus className="h-4 w-4" />
                {airdropLoading ? "Requesting..." : "Airdrop"}
              </Button>
            </>
          ) : (
            <Button onClick={onConnect}>Connect Wallet</Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
