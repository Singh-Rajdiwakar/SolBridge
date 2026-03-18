"use client";

import { ExternalLink, Eye } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import { buildExplorerAddressUrl, shortenAddress } from "@/lib/solana";

export function BlockchainTransparencyPanel({ address }: { address?: string | null }) {
  return (
    <GlassCard>
      <SectionHeader
        title="Blockchain Transparency"
        subtitle="Public verification is a core wallet feature, not a hidden backend claim."
        action={<Eye className="h-4 w-4 text-cyan-300" />}
      />

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
        All transactions are recorded on a public ledger. Users can independently verify activity using blockchain
        explorers. This ensures trustless systems and prevents hidden transaction manipulation.
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Wallet Address</div>
          <div className="mt-2 text-sm font-semibold text-white">{address ? shortenAddress(address) : "--"}</div>
          <div className="mt-1 text-sm text-slate-400">Explorer-verifiable public account</div>
        </div>
        <a
          href={address ? buildExplorerAddressUrl(address) : "#"}
          target="_blank"
          rel="noreferrer"
          className={`rounded-lg border border-white/10 bg-white/[0.03] p-4 transition ${
            address ? "hover:border-cyan-300/24 hover:bg-white/[0.05]" : "pointer-events-none opacity-50"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Explorer Verification</div>
              <div className="mt-2 text-sm font-semibold text-white">View on Solana Explorer</div>
            </div>
            <ExternalLink className="h-4 w-4 text-cyan-300" />
          </div>
        </a>
      </div>
    </GlassCard>
  );
}
