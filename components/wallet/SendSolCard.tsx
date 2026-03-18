"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PublicKey } from "@solana/web3.js";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmActionModal, EmptyState, FormField, GlassCard, SectionHeader } from "@/components/shared";
import { DEFAULT_SOL_FEE } from "@/lib/solana";
import type { WalletSendInput } from "@/types";
import { formatNumber } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sendSchema = z.object({
  receiver: z.string().refine((value) => {
    try {
      new PublicKey(value);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid Solana address"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
});

export function SendSolCard({
  balanceSol,
  connected,
  loading,
  onSend,
}: {
  balanceSol: number;
  connected: boolean;
  loading?: boolean;
  onSend: (data: WalletSendInput) => Promise<void> | void;
}) {
  const [confirmValues, setConfirmValues] = useState<WalletSendInput | null>(null);
  const form = useForm<WalletSendInput>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      receiver: "",
      amount: 0.01,
    },
  });

  const amount = form.watch("amount") || 0;
  const remainingBalance = useMemo(
    () => Math.max(0, balanceSol - amount - DEFAULT_SOL_FEE),
    [amount, balanceSol],
  );

  if (!connected) {
    return (
      <GlassCard>
        <SectionHeader title="Send SOL" subtitle="Connect a wallet to validate addresses, preview fees, and send SOL." />
        <EmptyState title="Wallet not connected" description="Create or connect a wallet first to enable SOL transfers." />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader title="Send SOL" subtitle="Validate the receiver, estimate network fee, and confirm before broadcast." />

      <form className="space-y-4" onSubmit={form.handleSubmit((values) => setConfirmValues(values))}>
        <FormField
          label="Receiver address"
          htmlFor="send-sol-receiver"
          error={form.formState.errors.receiver?.message}
        >
          <Input id="send-sol-receiver" placeholder="Enter a Solana address" {...form.register("receiver")} />
        </FormField>

        <FormField label="Amount" htmlFor="send-sol-amount" error={form.formState.errors.amount?.message}>
          <Input id="send-sol-amount" type="number" step="0.0001" min="0" {...form.register("amount")} />
        </FormField>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Estimated Fee</div>
            <div className="mt-2 text-lg font-semibold text-white">{formatNumber(DEFAULT_SOL_FEE, 6)} SOL</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Remaining Balance</div>
            <div className="mt-2 text-lg font-semibold text-white">{formatNumber(remainingBalance, 6)} SOL</div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </Button>
      </form>

      <ConfirmActionModal
        open={Boolean(confirmValues)}
        onClose={() => setConfirmValues(null)}
        title="Confirm SOL Transfer"
        description={
          confirmValues
            ? `Send ${formatNumber(confirmValues.amount, 6)} SOL with an estimated fee of ${formatNumber(DEFAULT_SOL_FEE, 6)} SOL?`
            : ""
        }
        loading={loading}
        onConfirm={() => {
          if (!confirmValues) {
            return;
          }

          void Promise.resolve(onSend(confirmValues)).then(() => {
            form.reset({
              receiver: "",
              amount: 0.01,
            });
            setConfirmValues(null);
          });
        }}
      />
    </GlassCard>
  );
}
