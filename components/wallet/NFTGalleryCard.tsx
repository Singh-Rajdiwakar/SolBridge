"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Gem, ImageIcon } from "lucide-react";

import { GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import { EmptyStateBlock } from "@/components/wallet/EmptyStateBlock";
import { ModalDialog } from "@/components/dashboard/modal-dialog";
import type { WalletNft } from "@/types";
import { shortenAddress } from "@/lib/solana";

export function NFTGalleryCard({
  nfts,
  loading,
}: {
  nfts: WalletNft[];
  loading?: boolean;
}) {
  const [selectedNft, setSelectedNft] = useState<WalletNft | null>(null);

  return (
    <GlassCard className="h-full">
      <SectionHeader
        title="NFT Gallery"
        subtitle="Digital collectibles, mint identity, and collection-level metadata surfaced in a premium wallet gallery."
        action={<ImageIcon className="h-4 w-4 text-cyan-300" />}
      />

      {loading ? (
        <LoadingSkeleton type="list" />
      ) : nfts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {nfts.map((nft, index) => (
            <motion.button
              key={nft.mint}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: index * 0.04 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,27,49,0.92),rgba(8,14,28,0.96))] text-left shadow-[0_24px_54px_rgba(0,0,0,0.28)]"
              onClick={() => setSelectedNft(nft)}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),transparent_38%,rgba(59,130,246,0.1))] opacity-80 transition group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
              <div className="relative overflow-hidden">
                <img src={nft.image} alt={nft.name} className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent opacity-85" />
              </div>
              <div className="relative space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-md border border-cyan-400/16 bg-cyan-400/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                    {nft.collection}
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                    Token
                  </div>
                </div>
                <div className="text-base font-semibold text-white">{nft.name}</div>
                <div className="text-sm text-slate-400">{shortenAddress(nft.mint)}</div>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="relative overflow-hidden rounded-xl border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(17,27,49,0.72),rgba(8,14,28,0.9))] p-3"
                animate={{ y: [0, -4, 0], opacity: [0.78, 1, 0.78] }}
                transition={{ duration: 4 + index * 0.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <div className="h-40 rounded-lg border border-dashed border-cyan-400/18 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />
                <div className="mt-3 h-3 w-2/3 rounded-full bg-white/10" />
                <div className="mt-2 h-2.5 w-1/2 rounded-full bg-white/6" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent,rgba(34,211,238,0.08),transparent)] opacity-90 blur-md" />
              </motion.div>
            ))}
          </div>
          <EmptyStateBlock
            title="No NFTs found in this wallet."
            description="Digital collectibles will appear here after detection. Once minted or transferred in, gallery cards, metadata, and mint verification will populate automatically."
            icon={<Gem className="h-5 w-5" />}
          />
        </div>
      )}

      <ModalDialog
        open={Boolean(selectedNft)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNft(null);
          }
        }}
        title={selectedNft?.name || "NFT Details"}
        description={selectedNft?.collection}
      >
        {selectedNft ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2">
              <img src={selectedNft.image} alt={selectedNft.name} className="h-64 w-full rounded-lg object-cover" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Collection" value={selectedNft.collection} />
              <Metric label="Owner" value={shortenAddress(selectedNft.owner)} />
            </div>
            <Metric label="Mint Address" value={selectedNft.mint} wrap />
            {selectedNft.attributes.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedNft.attributes.map((attribute) => (
                  <Metric key={`${attribute.traitType}-${attribute.value}`} label={attribute.traitType} value={attribute.value} />
                ))}
              </div>
            ) : null}
            <a
              href={selectedNft.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-blue-400/24 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_18px_46px_rgba(18,85,220,0.3)] transition hover:-translate-y-0.5"
            >
              View on Explorer
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : null}
      </ModalDialog>
    </GlassCard>
  );
}

function Metric({
  label,
  value,
  wrap = false,
}: {
  label: string;
  value: string;
  wrap?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={`mt-2 text-sm font-semibold text-white ${wrap ? "break-all" : ""}`}>{value}</div>
    </div>
  );
}
