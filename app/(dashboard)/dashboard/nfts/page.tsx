"use client";

import { useMemo } from "react";
import { ImageIcon, Wallet } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { BlockchainTransparencyPanel, NFTGallery, NetworkPerformanceCard, TransactionHistory } from "@/components/wallet";
import { GlassCard, SectionHeader } from "@/components/shared";
import { useWalletData } from "@/hooks/use-wallet-data";
import { DEFAULT_SOL_FEE } from "@/lib/solana";

export default function NftsPage() {
  const {
    wallet,
    connected,
    nftQuery,
    transactions,
    gasOptimizationQuery,
    latencyMs,
    address,
  } = useWalletData();

  const nftTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type.toLowerCase().includes("nft")),
    [transactions],
  );
  const collectionBreakdown = useMemo(() => {
    const collectionMap = new Map<string, number>();
    (nftQuery.data || []).forEach((nft) => {
      collectionMap.set(nft.collection, (collectionMap.get(nft.collection) || 0) + 1);
    });
    return Array.from(collectionMap.entries()).map(([collection, count]) => ({ collection, count }));
  }, [nftQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="NFT Gallery"
        subtitle="Collector-friendly NFT browsing with mint transparency, explorer verification, and wallet-level context."
        action={
          <Button onClick={wallet.openConnectModal}>
            <Wallet className="h-4 w-4" />
            {connected ? "Switch Wallet" : "Connect Wallet"}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <GlassCard>
          <SectionHeader
            title="NFT Overview"
            subtitle="Owned NFT count, explorer transparency, and Devnet execution context."
            action={<ImageIcon className="h-4 w-4 text-cyan-300" />}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Owned NFTs</div>
              <div className="mt-2 text-3xl font-semibold text-white">{nftQuery.data?.length || 0}</div>
              <div className="mt-1 text-sm text-slate-400">Displayed from the connected wallet inventory.</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Explorer Transparency</div>
              <div className="mt-2 text-lg font-semibold text-white">Mint-address verifiable</div>
              <div className="mt-1 text-sm text-slate-400">Every NFT modal exposes the public mint and explorer shortcut.</div>
            </div>
          </div>
          <div className="mt-4">
            <BlockchainTransparencyPanel address={address} />
          </div>
        </GlassCard>

        <NetworkPerformanceCard
          latencyMs={latencyMs}
          feeEstimate={gasOptimizationQuery.data?.currentFee || DEFAULT_SOL_FEE}
        />
      </div>

      <NFTGallery nfts={nftQuery.data || []} loading={nftQuery.isLoading && connected} />

      <GlassCard>
        <SectionHeader
          title="NFT Insights"
          subtitle="Collection concentration, explorer transparency, and wallet-level collectible telemetry."
          action={<ImageIcon className="h-4 w-4 text-cyan-300" />}
        />
        {collectionBreakdown.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {collectionBreakdown.map((item) => (
              <div key={item.collection} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.collection}</div>
                <div className="mt-3 text-2xl font-semibold text-white">{item.count}</div>
                <div className="mt-1 text-sm text-slate-400">Detected NFTs in this collection.</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
            No NFTs detected yet. Once collectibles are discovered, collection concentration and explorer-ready mint insights will appear here.
          </div>
        )}
      </GlassCard>

      <TransactionHistory transactions={nftTransactions} loading={false} />
    </div>
  );
}
