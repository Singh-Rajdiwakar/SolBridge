"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Coins, Eye, ShieldCheck, ShieldQuestion, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { toast } from "sonner";

import {
  EmptyState,
  FormField,
  GlassCard,
  SectionHeader,
} from "@/components/shared";
import { TransactionSimulatorModal } from "@/components/wallet/TransactionSimulatorModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_SOL_FEE } from "@/lib/solana";
import { gasApi, securityApi, simulatorApi } from "@/services/api";
import type {
  AddressBookEntry,
  SecurityCheckResponse,
  TransactionSimulationResponse,
  WalletSendInput,
} from "@/types";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

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

function riskTone(check?: SecurityCheckResponse) {
  if (!check) {
    return "border-white/10 bg-white/[0.03] text-slate-300";
  }
  if (check.riskLevel === "Safe") {
    return "border-emerald-400/18 bg-emerald-500/10 text-emerald-100";
  }
  if (check.riskLevel === "Suspicious") {
    return "border-amber-400/18 bg-amber-500/10 text-amber-100";
  }
  return "border-rose-400/18 bg-rose-500/10 text-rose-100";
}

function RiskIcon({ check }: { check?: SecurityCheckResponse }) {
  if (!check || check.riskLevel === "Safe") {
    return <ShieldCheck className="h-4 w-4 text-emerald-300" />;
  }
  if (check.riskLevel === "Suspicious") {
    return <ShieldQuestion className="h-4 w-4 text-amber-200" />;
  }
  return <AlertTriangle className="h-4 w-4 text-rose-300" />;
}

export function SendPanel({
  connected,
  balanceSol,
  loading,
  addressBook,
  prefillReceiver,
  walletAddress,
  onSend,
  onSaveAddress,
  onUseSavedAddress,
  onDraftChange,
  onPreviewStateChange,
}: {
  connected: boolean;
  balanceSol: number;
  loading?: boolean;
  addressBook: AddressBookEntry[];
  prefillReceiver?: string | null;
  walletAddress?: string | null;
  onSend: (data: WalletSendInput) => Promise<void> | void;
  onSaveAddress: (payload: { name: string; address: string }) => void;
  onUseSavedAddress?: (entry: AddressBookEntry) => void;
  onDraftChange?: (draft: { receiver: string; amount: number; valid: boolean; fee: number }) => void;
  onPreviewStateChange?: (state: "idle" | "previewing" | "ready") => void;
}) {
  const [simulation, setSimulation] = useState<TransactionSimulationResponse | null>(null);
  const [confirmValues, setConfirmValues] = useState<WalletSendInput | null>(null);
  const [memo, setMemo] = useState("");
  const form = useForm<WalletSendInput>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      receiver: "",
      amount: 0.01,
    },
  });

  const amount = form.watch("amount") || 0;
  const receiver = form.watch("receiver");
  const receiverValid = useMemo(() => {
    try {
      if (!receiver) {
        return false;
      }
      new PublicKey(receiver);
      return true;
    } catch {
      return false;
    }
  }, [receiver]);

  const gasQuery = useQuery({
    queryKey: ["wallet", "gas-optimization", walletAddress],
    queryFn: () => gasApi.optimize(walletAddress || undefined),
    enabled: connected,
    staleTime: 1000 * 30,
  });

  const securityQuery = useQuery({
    queryKey: ["wallet", "security-check", walletAddress, receiver, amount],
    queryFn: () =>
      securityApi.checkTransaction({
        walletAddress: walletAddress || undefined,
        receiverAddress: receiver,
        amount,
        token: "SOL",
      }),
    enabled: connected && receiverValid && amount > 0,
    staleTime: 1000 * 15,
    retry: false,
  });

  const simulatorMutation = useMutation({
    mutationFn: (values: WalletSendInput) =>
      simulatorApi.transaction({
        kind: "send",
        walletAddress: walletAddress || undefined,
        receiverAddress: values.receiver,
        amount: values.amount,
        token: "SOL",
      }),
    onSuccess: (result, values) => {
      setSimulation(result);
      setConfirmValues(values);
      onPreviewStateChange?.("ready");
    },
    onError: (error: unknown) => {
      onPreviewStateChange?.("idle");
      toast.error(error instanceof Error ? error.message : "Simulation failed");
    },
  });

  const activeFee = gasQuery.data?.currentFee ?? DEFAULT_SOL_FEE;
  const remainingBalance = useMemo(
    () => Math.max(0, balanceSol - amount - activeFee),
    [activeFee, amount, balanceSol],
  );
  const totalDeduction = useMemo(() => amount + activeFee, [amount, activeFee]);

  useEffect(() => {
    if (prefillReceiver) {
      form.setValue("receiver", prefillReceiver, { shouldValidate: true });
    }
  }, [form, prefillReceiver]);

  useEffect(() => {
    onDraftChange?.({
      receiver: receiver || "",
      amount,
      valid: receiverValid,
      fee: activeFee,
    });
  }, [activeFee, amount, onDraftChange, receiver, receiverValid]);

  useEffect(() => {
    if (!receiver || amount <= 0 || !receiverValid) {
      onPreviewStateChange?.("idle");
    }
  }, [amount, onPreviewStateChange, receiver, receiverValid]);

  if (!connected) {
    return (
      <GlassCard>
        <SectionHeader title="Send Crypto" subtitle="Connect a wallet to validate addresses, preview fees, and broadcast transfers." />
        <EmptyState title="Wallet not connected" description="Create or connect a wallet first to enable SOL transfers." />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader title="Send / Preview" subtitle="AI-screened transfer flow with saved contacts, fee timing, and transaction simulation." />

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          onPreviewStateChange?.("previewing");
          void simulatorMutation.mutateAsync(values);
        })}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Asset" htmlFor="wallet-send-token">
            <Select value="SOL" onValueChange={() => undefined}>
              <SelectTrigger id="wallet-send-token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOL">SOL</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Saved address" htmlFor="wallet-send-saved">
            <Select
              onValueChange={(value) => {
                const selected = addressBook.find((entry) => entry.id === value);
                if (selected) {
                  form.setValue("receiver", selected.address, { shouldValidate: true });
                  onUseSavedAddress?.(selected);
                }
              }}
            >
              <SelectTrigger id="wallet-send-saved">
                <SelectValue placeholder="Choose a saved contact" />
              </SelectTrigger>
              <SelectContent>
                {addressBook.length > 0 ? (
                  addressBook.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__empty" disabled>
                    No contacts saved
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label="Receiver address" htmlFor="wallet-send-address" error={form.formState.errors.receiver?.message}>
          <Input id="wallet-send-address" placeholder="Enter a Solana address" {...form.register("receiver")} />
        </FormField>

        <FormField label="Amount (SOL)" htmlFor="wallet-send-amount" error={form.formState.errors.amount?.message}>
          <div className="flex gap-2">
            <Input id="wallet-send-amount" type="number" min="0" step="0.0001" {...form.register("amount")} />
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                form.setValue("amount", Math.max(0, balanceSol - activeFee), { shouldValidate: true })
              }
            >
              Max
            </Button>
          </div>
        </FormField>

        <FormField label="Memo (optional)" htmlFor="wallet-send-memo">
          <Input id="wallet-send-memo" placeholder="Internal note or transfer memo" value={memo} onChange={(event) => setMemo(event.target.value)} />
        </FormField>

        <div className={cn("rounded-lg border p-4", riskTone(securityQuery.data))}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <RiskIcon check={securityQuery.data} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Fraud Detection</div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {securityQuery.data
                    ? `${securityQuery.data.riskLevel} · ${securityQuery.data.confidence}% confidence`
                    : "Waiting for receiver details"}
                </div>
                <div className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
                  {securityQuery.data?.warnings?.slice(0, 2).map((warning) => (
                    <div key={warning}>{warning}</div>
                  )) || <div>Enter a valid address and amount to trigger AI risk analysis.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-cyan-400/16 bg-cyan-400/8 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Gas Optimizer</div>
              <div className="mt-2 text-sm font-semibold text-white">
                Network Fee {formatNumber(activeFee, 6)} SOL
              </div>
              <div className="mt-1 text-sm text-slate-300">
                {gasQuery.data
                  ? `${gasQuery.data.estimatedConfirmationTime} · ${gasQuery.data.recommendation}`
                  : "Loading optimization suggestion..."}
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
              {gasQuery.data?.congestionLevel || "Analyzing"}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Available Balance</div>
              <Wallet className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="mt-2 text-lg font-semibold text-white">{formatNumber(balanceSol, 6)} SOL</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Network Fee</div>
              <Coins className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="mt-2 text-lg font-semibold text-white">{formatNumber(activeFee, 6)} SOL</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Deduction</div>
              <Eye className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="mt-2 text-lg font-semibold text-white">{formatNumber(totalDeduction, 6)} SOL</div>
            <div className="mt-1 text-xs text-slate-500">Remaining {formatNumber(remainingBalance, 6)} SOL</div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || simulatorMutation.isPending}
        >
          {loading || simulatorMutation.isPending
            ? "Running Simulation..."
            : "Preview Transaction"}
        </Button>
      </form>

      <TransactionSimulatorModal
        open={Boolean(confirmValues && simulation)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmValues(null);
            setSimulation(null);
            onPreviewStateChange?.("idle");
          }
        }}
        simulation={simulation}
        loading={loading}
        onConfirm={() => {
          if (!confirmValues) {
            return;
          }

          void Promise.resolve(
            onSend({
              ...confirmValues,
              note: memo.trim() || undefined,
            }),
          ).then(() => {
            if (receiver.trim() && !addressBook.some((entry) => entry.address === receiver.trim())) {
              onSaveAddress({
                name: memo.trim() || `Contact ${receiver.slice(0, 4)}`,
                address: receiver.trim(),
              });
            }
            form.reset({ receiver: "", amount: 0.01 });
            setConfirmValues(null);
            setSimulation(null);
            setMemo("");
            onPreviewStateChange?.("idle");
          });
        }}
      />
    </GlassCard>
  );
}
