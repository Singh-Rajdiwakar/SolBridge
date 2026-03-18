"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmActionModal, EmptyState, FormField, GlassCard, SectionHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WalletSwapResponse, WalletTokenBalance } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

const swapSchema = z.object({
  fromToken: z.string().min(2),
  toToken: z.string().min(2),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  slippage: z.coerce.number().min(0).max(5),
});

type SwapFormValues = z.infer<typeof swapSchema>;

export function SwapPanel({
  connected,
  tokens,
  preview,
  previewLoading,
  loading,
  onPreview,
  onSwap,
}: {
  connected: boolean;
  tokens: WalletTokenBalance[];
  preview?: WalletSwapResponse | null;
  previewLoading?: boolean;
  loading?: boolean;
  onPreview: (values: SwapFormValues) => void;
  onSwap: (values: SwapFormValues) => Promise<void> | void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const form = useForm<SwapFormValues>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      fromToken: "SOL",
      toToken: "USDC",
      amount: 0.5,
      slippage: 0.5,
    },
  });

  const values = form.watch();

  useEffect(() => {
    if (!connected || !values.amount || values.fromToken === values.toToken) {
      return;
    }

    const timer = window.setTimeout(() => {
      onPreview({
        fromToken: values.fromToken,
        toToken: values.toToken,
        amount: values.amount,
        slippage: values.slippage,
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [connected, onPreview, values.amount, values.fromToken, values.toToken, values.slippage]);

  if (!connected) {
    return (
      <GlassCard>
        <SectionHeader title="Swap Tokens" subtitle="Connect a wallet to simulate a token swap quote on Devnet." />
        <EmptyState title="Wallet not connected" description="Connect a wallet to preview routes and simulate a swap." />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader title="Swap Tokens" subtitle="Devnet swap simulator with price, slippage, and network fee preview." />

      <form className="space-y-4" onSubmit={form.handleSubmit(() => setConfirmOpen(true))}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="From Token" htmlFor="swap-from-token" error={form.formState.errors.fromToken?.message}>
            <Select value={values.fromToken} onValueChange={(value) => form.setValue("fromToken", value)}>
              <SelectTrigger id="swap-from-token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="To Token" htmlFor="swap-to-token" error={form.formState.errors.toToken?.message}>
            <Select value={values.toToken} onValueChange={(value) => form.setValue("toToken", value)}>
              <SelectTrigger id="swap-to-token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.filter((token) => token.symbol !== values.fromToken).map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Amount" htmlFor="swap-amount" error={form.formState.errors.amount?.message}>
            <Input id="swap-amount" type="number" min="0" step="0.0001" {...form.register("amount")} />
          </FormField>
          <FormField label="Slippage %" htmlFor="swap-slippage" error={form.formState.errors.slippage?.message}>
            <Input id="swap-slippage" type="number" min="0" max="5" step="0.1" {...form.register("slippage")} />
          </FormField>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ArrowDownUp className="h-4 w-4 text-cyan-300" />
            Swap Preview
          </div>
          {previewLoading ? (
            <div className="mt-3 text-sm text-slate-400">Updating route preview...</div>
          ) : preview ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-[#0b1324] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Estimated Output</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(preview.amountOut, preview.toToken === "BONK" ? 0 : 6)} {preview.toToken}
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-[#0b1324] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Route Value</div>
                <div className="mt-2 text-lg font-semibold text-white">{formatCurrency(preview.usdValue)}</div>
              </div>
              <div className="text-sm text-slate-300">Execution Price: {formatNumber(preview.executionPrice, 6)}</div>
              <div className="text-sm text-slate-300">Price Impact: {formatNumber(preview.priceImpact, 2)}%</div>
              <div className="text-sm text-slate-300">Slippage: {formatNumber(preview.slippage, 2)}%</div>
              <div className="text-sm text-slate-300">Network Fee: {formatNumber(preview.networkFee, 6)} SOL</div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-400">Enter a valid amount and token pair to preview the swap quote.</div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || values.fromToken === values.toToken}>
          {loading ? "Swapping..." : "Swap Tokens"}
        </Button>
      </form>

      <ConfirmActionModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Simulated Swap"
        description={
          preview
            ? `Simulate swapping ${formatNumber(values.amount, 4)} ${values.fromToken} into approximately ${formatNumber(preview.amountOut, preview.toToken === "BONK" ? 0 : 6)} ${preview.toToken}?`
            : "Review the preview before executing the simulated swap."
        }
        loading={loading}
        onConfirm={() => {
          void Promise.resolve(onSwap(values)).then(() => setConfirmOpen(false));
        }}
      />
    </GlassCard>
  );
}
