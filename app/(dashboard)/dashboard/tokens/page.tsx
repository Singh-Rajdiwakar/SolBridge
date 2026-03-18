"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { Coins, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { AssetTable, CreateTokenPanel, NetworkPerformanceCard, TokenDetailDrawer, TokenPortfolio } from "@/components/wallet";
import { useWalletData } from "@/hooks/use-wallet-data";
import { DEFAULT_SOL_FEE, shortenAddress } from "@/lib/solana";
import { walletApi } from "@/services/api";
import type { WalletCreateTokenInput, WalletTokenBalance } from "@/types";
import { formatNumber } from "@/utils/format";

type CreatedTokenResult = {
  mintAddress: string;
  transactionSignature?: string;
  symbol?: string;
  decimals?: number;
  initialSupply?: number;
};

function toBaseUnits(amount: number, decimals: number) {
  const [wholePart = "0", fractionalPart = ""] = amount.toString().split(".");
  const normalizedFractional = `${fractionalPart}${"0".repeat(decimals)}`.slice(0, decimals);
  return BigInt(`${wholePart}${normalizedFractional || ""}` || "0");
}

export default function TokensPage() {
  const router = useRouter();
  const {
    wallet,
    connected,
    address,
    providerName,
    portfolioQuery,
    portfolioTokens,
    balanceHistory,
    gasOptimizationQuery,
    latencyMs,
    stakingConfigQuery,
    governanceConfigQuery,
    liquidityPoolsQuery,
    onChainSummary,
  } = useWalletData();
  const [selectedToken, setSelectedToken] = useState<WalletTokenBalance | null>(null);
  const [createdTokenResult, setCreatedTokenResult] = useState<CreatedTokenResult | null>(null);

  const createTokenMutation = useMutation({
    mutationFn: async (values: WalletCreateTokenInput) => {
      if (!wallet.publicKey || !address) {
        throw new Error("Connect a wallet first.");
      }

      const mintKeypair = Keypair.generate();
      const mintRent = await wallet.connection.getMinimumBalanceForRentExemption(MINT_SIZE, "confirmed");
      const associatedTokenAddress = getAssociatedTokenAddressSync(mintKeypair.publicKey, wallet.publicKey);
      const mintAmount = toBaseUnits(values.initialSupply, values.decimals);
      const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(mintKeypair.publicKey, values.decimals, wallet.publicKey, wallet.publicKey),
        createAssociatedTokenAccountInstruction(wallet.publicKey, associatedTokenAddress, wallet.publicKey, mintKeypair.publicKey),
        createMintToInstruction(mintKeypair.publicKey, associatedTokenAddress, wallet.publicKey, mintAmount),
      );

      const signature = await wallet.signAndSendTransaction(mintTransaction, [mintKeypair]);
      const result = await walletApi.createToken({
        address,
        mintAddress: mintKeypair.publicKey.toBase58(),
        signature,
        name: values.name,
        symbol: values.symbol.toUpperCase(),
        decimals: values.decimals,
        initialSupply: values.initialSupply,
        provider: providerName || "Retix Wallet",
      });

      return {
        mintAddress: result.mintAddress as string,
        transactionSignature: result.transactionSignature as string | undefined,
        symbol: values.symbol.toUpperCase(),
        decimals: values.decimals,
        initialSupply: values.initialSupply,
      };
    },
    onSuccess: (result) => {
      setCreatedTokenResult(result);
      toast.success("SPL token created successfully");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Token creation failed");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Token Management"
        subtitle="Portfolio balances, token transparency, and Devnet SPL mint creation in one structured workspace."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => router.push("/dashboard/transfer")}>
              <Coins className="h-4 w-4" />
              Send Assets
            </Button>
            <Button onClick={wallet.openConnectModal}>
              <Wallet className="h-4 w-4" />
              {connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      <SectionCard
        title="On-chain token discovery"
        description="Token balances are combined with protocol mint metadata so staking mints, governance assets, and pool-backed LP exposure stay visible from the same wallet surface."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Token accounts</div>
            <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(portfolioTokens.length, 0)}</div>
            <div className="mt-2 text-sm text-slate-400">Discovered via connected wallet RPC reads</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Staking mint</div>
            <div className="mt-3 text-lg font-semibold text-white">
              {stakingConfigQuery.data?.stakingMint ? shortenAddress(stakingConfigQuery.data.stakingMint) : "Pending"}
            </div>
            <div className="mt-2 text-sm text-slate-400">Source of truth comes from staking config PDA</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Governance mint</div>
            <div className="mt-3 text-lg font-semibold text-white">
              {governanceConfigQuery.data?.governanceMint ? shortenAddress(governanceConfigQuery.data.governanceMint) : "Pending"}
            </div>
            <div className="mt-2 text-sm text-slate-400">Voting power token read directly from governance config</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">LP exposure</div>
            <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(onChainSummary.totalLpBalance, 4)}</div>
            <div className="mt-2 text-sm text-slate-400">
              {liquidityPoolsQuery.data?.pools.length || 0} on-chain pools connected
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Token Authority Viewer"
        description="Authority and mint-control visibility for protocol tokens and newly created SPL assets."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Created token authority</div>
            <div className="mt-3 text-lg font-semibold text-white">{createdTokenResult?.symbol || "Pending mint"}</div>
            <div className="mt-2 text-sm text-slate-400">
              {createdTokenResult ? `Mint authority ${shortenAddress(address || "")}` : "Create a token to surface mint authority and supply controls."}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Staking reward authority</div>
            <div className="mt-3 text-lg font-semibold text-white">
              {stakingConfigQuery.data?.admin ? shortenAddress(stakingConfigQuery.data.admin) : "Pending"}
            </div>
            <div className="mt-2 text-sm text-slate-400">Reward and staking mint controls are derived from the staking config PDA.</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Governance authority</div>
            <div className="mt-3 text-lg font-semibold text-white">
              {governanceConfigQuery.data?.admin ? shortenAddress(governanceConfigQuery.data.admin) : "Pending"}
            </div>
            <div className="mt-2 text-sm text-slate-400">Proposal threshold and governance mint authority reference the configured governance admin.</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">LP token authority</div>
            <div className="mt-3 text-lg font-semibold text-white">
              {liquidityPoolsQuery.data?.pools[0]?.admin ? shortenAddress(liquidityPoolsQuery.data.pools[0].admin) : "Pool authority pending"}
            </div>
            <div className="mt-2 text-sm text-slate-400">Liquidity pool mint control is tied to the pool program authority, not an off-chain service.</div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <TokenPortfolio
          tokens={portfolioTokens}
          allocation={portfolioQuery.data?.allocation || []}
          history={balanceHistory}
          loading={portfolioQuery.isLoading && connected}
        />

        <div className="space-y-6">
          <CreateTokenPanel
            connected={connected}
            loading={createTokenMutation.isPending}
            result={createdTokenResult || undefined}
            onCopyMint={async () => {
              if (!createdTokenResult?.mintAddress) {
                return;
              }
              await navigator.clipboard.writeText(createdTokenResult.mintAddress);
              toast.success("Mint address copied");
            }}
            onCreate={async (values) => {
              await createTokenMutation.mutateAsync(values);
            }}
          />

          <NetworkPerformanceCard
            latencyMs={latencyMs}
            feeEstimate={gasOptimizationQuery.data?.currentFee || DEFAULT_SOL_FEE}
          />
        </div>
      </div>

      <AssetTable tokens={portfolioTokens} onSelectToken={setSelectedToken} />

      <TokenDetailDrawer
        token={selectedToken}
        open={Boolean(selectedToken)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedToken(null);
          }
        }}
        history={balanceHistory}
        onSend={() => router.push("/dashboard/transfer")}
        onReceive={() => router.push("/dashboard/transfer")}
        onSwap={() => router.push("/dashboard/swap")}
      />
    </div>
  );
}
