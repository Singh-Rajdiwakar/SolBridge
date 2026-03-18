/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ImageIcon } from "lucide-react";

import { EmptyState, GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import { ModalDialog } from "@/components/dashboard/modal-dialog";
import type { WalletNft } from "@/types";
import { shortenAddress } from "@/lib/solana";

export function NFTGallery({
  nfts,
  loading,
}: {
  nfts: WalletNft[];
  loading?: boolean;
}) {
  const [selectedNft, setSelectedNft] = useState<WalletNft | null>(null);

  return (
    <GlassCard>
      <SectionHeader
        title="NFT Gallery"
        subtitle="View owned collectibles, inspect metadata, and open mint addresses on Solana Explorer."
        action={<ImageIcon className="h-4 w-4 text-cyan-300" />}
      />

      {loading ? (
        <LoadingSkeleton type="list" />
      ) : nfts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {nfts.map((nft) => (
            <motion.button
              key={nft.mint}
              type="button"
              whileHover={{ y: -4, rotateX: 1.2, rotateY: -1.2 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(17,27,49,0.84),rgba(8,14,28,0.92))] text-left [transform-style:preserve-3d] transition hover:border-cyan-300/25"
              onClick={() => setSelectedNft(nft)}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),transparent_38%,rgba(59,130,246,0.1))] opacity-80 transition group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
              <img src={nft.image} alt={nft.name} className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-cyan-300">{nft.collection}</div>
                  <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Holographic
                  </div>
                </div>
                <div className="text-base font-semibold text-white">{nft.name}</div>
                <div className="text-sm text-slate-400">{shortenAddress(nft.mint)}</div>
                <div className="pt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">Tap for metadata, attributes, and explorer access</div>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <EmptyState title="No NFTs detected" description="Owned NFTs will appear here when the connected wallet holds collectibles." />
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
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <img src={selectedNft.image} alt={selectedNft.name} className="h-64 w-full rounded-md object-cover" />
            </div>
            <p className="text-sm text-slate-300">{selectedNft.description || "No metadata description available."}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Collection</div>
                <div className="mt-2 text-sm font-semibold text-white">{selectedNft.collection}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Owner</div>
                <div className="mt-2 text-sm font-semibold text-white">{shortenAddress(selectedNft.owner)}</div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Mint Address</div>
              <div className="mt-2 break-all text-sm text-white">{selectedNft.mint}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedNft.attributes.map((attribute) => (
                <div key={`${attribute.traitType}-${attribute.value}`} className="rounded-md border border-white/10 bg-[#0b1324] p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{attribute.traitType}</div>
                  <div className="mt-2 text-sm font-medium text-white">{attribute.value}</div>
                </div>
              ))}
            </div>
            <a
              href={selectedNft.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-blue-400/25 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_16px_42px_rgba(20,76,180,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105"
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
