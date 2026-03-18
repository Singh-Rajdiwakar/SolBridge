"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EmptyState, FormField, GlassCard, SectionHeader } from "@/components/shared";
import { buildExplorerAddressUrl, buildExplorerUrl } from "@/lib/solana";
import type { WalletCreateTokenInput } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const tokenSchema = z.object({
  name: z.string().min(2, "Token name is required"),
  symbol: z.string().min(2, "Token symbol is required").max(10, "Keep the symbol concise"),
  decimals: z.coerce.number().int().min(0).max(9),
  initialSupply: z.coerce.number().positive("Initial supply must be positive"),
});

export function CreateTokenCard({
  connected,
  loading,
  result,
  onCopyMint,
  onCreate,
}: {
  connected: boolean;
  loading?: boolean;
  result?: {
    mintAddress: string;
    transactionSignature?: string;
    symbol?: string;
    decimals?: number;
    initialSupply?: number;
  };
  onCopyMint: () => void;
  onCreate: (values: WalletCreateTokenInput) => Promise<void> | void;
}) {
  const form = useForm<WalletCreateTokenInput>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      name: "Retix Token",
      symbol: "RTX",
      decimals: 9,
      initialSupply: 1000000,
    },
  });

  if (!connected) {
    return (
      <GlassCard>
        <SectionHeader title="Create SPL Token" subtitle="Connect a wallet to mint a new devnet token and initial supply." />
        <EmptyState title="Wallet not connected" description="Connect a wallet before creating an SPL token on Solana Devnet." />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader title="Create SPL Token" subtitle="Create a mint, token account, and initial supply on Solana Devnet." />

      <form className="space-y-4" onSubmit={form.handleSubmit((values) => void onCreate(values))}>
        <FormField label="Token Name" htmlFor="token-name" error={form.formState.errors.name?.message}>
          <Input id="token-name" {...form.register("name")} />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Token Symbol" htmlFor="token-symbol" error={form.formState.errors.symbol?.message}>
            <Input id="token-symbol" {...form.register("symbol")} />
          </FormField>
          <FormField label="Decimals" htmlFor="token-decimals" error={form.formState.errors.decimals?.message}>
            <Input id="token-decimals" type="number" {...form.register("decimals")} />
          </FormField>
        </div>

        <FormField
          label="Initial Supply"
          htmlFor="token-supply"
          error={form.formState.errors.initialSupply?.message}
        >
          <Input id="token-supply" type="number" {...form.register("initialSupply")} />
        </FormField>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Token (Devnet)"}
        </Button>
      </form>

      {result ? (
        <div className="mt-4 rounded-lg border border-emerald-400/15 bg-emerald-500/8 p-4">
          <div className="text-sm font-semibold text-white">Token created successfully</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-black/10 p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-emerald-200">Mint Address</div>
              <div className="mt-2 break-all text-sm text-slate-100">{result.mintAddress}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-black/10 p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-emerald-200">Token Details</div>
              <div className="mt-2 space-y-1 text-sm text-slate-100">
                <div>Symbol: {result.symbol || "--"}</div>
                <div>Supply: {result.initialSupply ?? "--"}</div>
                <div>Decimals: {result.decimals ?? "--"}</div>
              </div>
            </div>
          </div>
          {result.transactionSignature ? (
            <div className="mt-3 rounded-md border border-white/10 bg-black/10 p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-emerald-200">Transaction Signature</div>
              <div className="mt-2 break-all text-sm text-slate-100">{result.transactionSignature}</div>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={onCopyMint}>
              <Copy className="h-4 w-4" />
              Copy Mint Address
            </Button>
            <a
              href={buildExplorerAddressUrl(result.mintAddress)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-slate-100 transition hover:border-emerald-300/30"
            >
              View on Solana Explorer
              <ExternalLink className="h-4 w-4" />
            </a>
            {result.transactionSignature ? (
              <a
                href={buildExplorerUrl(result.transactionSignature)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-slate-100 transition hover:border-emerald-300/30"
              >
                Verify Mint Tx
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
