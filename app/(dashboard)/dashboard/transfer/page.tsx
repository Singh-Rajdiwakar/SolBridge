"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { AddressBookCard, NetworkPerformanceCard, ReceiveModal, SendPanel, TransactionHistory, TransactionStatusCard } from "@/components/wallet";
import { GlassCard, SectionHeader } from "@/components/shared";
import { useWalletData } from "@/hooks/use-wallet-data";
import { DEFAULT_SOL_FEE, shortenAddress } from "@/lib/solana";
import { addressBookApi, securityApi, walletApi } from "@/services/api";
import { getNetworkStatus } from "@/services/solanaService";
import type { AddressBookEntry, WalletSendInput } from "@/types";

type ExecutionState = {
  status: "Pending" | "Confirmed" | "Failed";
  title: string;
  signature?: string | null;
  timestamp?: string | null;
};

export default function TransferPage() {
  const queryClient = useQueryClient();
  const {
    wallet,
    connected,
    address,
    providerName,
    balanceQuery,
    transactionsQuery,
    transactions,
    addressBook,
    gasOptimizationQuery,
  } = useWalletData();
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [prefillReceiver, setPrefillReceiver] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);

  const networkStatusQuery = useQuery({
    queryKey: ["wallet", "network-status"],
    queryFn: getNetworkStatus,
    staleTime: 1000 * 30,
  });

  const createAddressMutation = useMutation({
    mutationFn: (payload: { name: string; walletAddress: string; network?: string; notes?: string }) =>
      addressBookApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "address-book"] });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; walletAddress?: string; network?: string; notes?: string };
    }) => addressBookApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "address-book"] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => addressBookApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "address-book"] });
    },
  });

  const sendMutation = useMutation({
    onMutate: () => {
      setExecutionState({
        status: "Pending",
        title: "Sending SOL",
        timestamp: new Date().toISOString(),
      });
    },
    mutationFn: async (values: WalletSendInput) => {
      if (!wallet.publicKey || !address) {
        throw new Error("Connect a wallet first.");
      }

      const balanceSol = balanceQuery.data?.balanceSol || 0;
      if (values.amount + DEFAULT_SOL_FEE >= balanceSol) {
        throw new Error("Insufficient balance for this transfer.");
      }

      const securityCheck = await securityApi.checkTransaction({
        walletAddress: address,
        receiverAddress: values.receiver,
        amount: values.amount,
        token: "SOL",
      });
      if (securityCheck.blocked) {
        throw new Error("Retix AI blocked this receiver as high-risk.");
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(values.receiver),
          lamports: Math.round(values.amount * LAMPORTS_PER_SOL),
        }),
      );

      const signature = await wallet.signAndSendTransaction(transaction);
      await walletApi.send({
        address,
        receiver: values.receiver,
        amount: values.amount,
        signature,
        provider: providerName || "Retix Wallet",
        note: values.note,
      });

      return signature;
    },
    onSuccess: (signature) => {
      setExecutionState({
        status: "Confirmed",
        title: "SOL transfer confirmed",
        signature,
        timestamp: new Date().toISOString(),
      });
      toast.success("SOL sent successfully");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error: unknown) => {
      setExecutionState({
        status: "Failed",
        title: "SOL transfer failed",
        timestamp: new Date().toISOString(),
      });
      toast.error(error instanceof Error ? error.message : "Failed to send SOL");
    },
  });

  const airdropMutation = useMutation({
    onMutate: () => {
      setExecutionState({
        status: "Pending",
        title: "Requesting Devnet airdrop",
        timestamp: new Date().toISOString(),
      });
    },
    mutationFn: async () => {
      if (!address) {
        throw new Error("Connect a wallet first.");
      }

      return walletApi.airdrop({ address, amount: 1 }) as Promise<{ signature?: string }>;
    },
    onSuccess: (result) => {
      setExecutionState({
        status: "Confirmed",
        title: "Airdrop received",
        signature: result.signature,
        timestamp: new Date().toISOString(),
      });
      toast.success("Airdrop successful");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error: unknown) => {
      setExecutionState({
        status: "Failed",
        title: "Airdrop request failed",
        timestamp: new Date().toISOString(),
      });
      toast.error(error instanceof Error ? error.message : "Airdrop failed");
    },
  });

  const transferTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        ["sent sol", "received sol", "airdrop"].some((type) => transaction.type.toLowerCase().includes(type)),
      ),
    [transactions],
  );

  const handleCopyAddress = async () => {
    if (!address) {
      toast.error("No wallet address available");
      return;
    }

    await navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  const handleSaveAddress = ({
    name,
    address: receiver,
    network,
  }: {
    name: string;
    address: string;
    network?: string;
  }) => {
    try {
      new PublicKey(receiver);
      createAddressMutation.mutate(
        {
          name,
          walletAddress: receiver,
          network: network || "Devnet",
        },
        {
          onSuccess: () => toast.success("Address saved"),
          onError: (error: unknown) =>
            toast.error(error instanceof Error ? error.message : "Failed to save address"),
        },
      );
    } catch {
      toast.error("Enter a valid address before saving");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send / Receive"
        subtitle="Wallet transfers, receive QR, public transaction verification, and trusted address-book workflows."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setReceiveModalOpen(true)}>
              <Wallet className="h-4 w-4" />
              Receive
            </Button>
            <Button variant="secondary" onClick={() => airdropMutation.mutate()} disabled={!connected || airdropMutation.isPending}>
              <Plus className="h-4 w-4" />
              Request Airdrop
            </Button>
            <Button onClick={wallet.openConnectModal}>
              <Wallet className="h-4 w-4" />
              {connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <TransactionStatusCard
            state={executionState}
            onCopySignature={async (signature) => {
              await navigator.clipboard.writeText(signature);
              toast.success("Signature copied");
            }}
          />

          <SendPanel
            connected={connected}
            balanceSol={balanceQuery.data?.balanceSol || 0}
            loading={sendMutation.isPending}
            addressBook={addressBook}
            prefillReceiver={prefillReceiver}
            walletAddress={address}
            onSend={async (values) => {
              await sendMutation.mutateAsync(values);
              setPrefillReceiver(null);
            }}
            onSaveAddress={handleSaveAddress}
            onUseSavedAddress={() => undefined}
          />

          <NetworkPerformanceCard
            latencyMs={networkStatusQuery.data?.latencyMs || 540}
            feeEstimate={gasOptimizationQuery.data?.currentFee || DEFAULT_SOL_FEE}
            rpcStatus={networkStatusQuery.data?.rpcStatus}
            blockHeight={networkStatusQuery.data?.blockHeight}
          />
        </div>

        <div className="space-y-6">
          <GlassCard>
            <SectionHeader
              title="Receive Panel"
              subtitle="Wallet QR, share flow, and public wallet verification for incoming Devnet transfers."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Wallet Address</div>
                <div className="mt-2 text-lg font-semibold text-white">{address ? shortenAddress(address) : "--"}</div>
                <div className="mt-1 break-all text-sm text-slate-400">{address || "Connect a wallet to receive assets."}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Estimated Network Fee</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {(gasOptimizationQuery.data?.currentFee || DEFAULT_SOL_FEE).toFixed(6)} SOL
                </div>
                <div className="mt-1 text-sm text-slate-400">Solana Devnet low-cost execution preview.</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => setReceiveModalOpen(true)}>Open Receive QR</Button>
              <Button variant="secondary" onClick={handleCopyAddress} disabled={!address}>
                Copy Address
              </Button>
            </div>
          </GlassCard>

          <AddressBookCard
            entries={addressBook}
            onAdd={handleSaveAddress}
            onEdit={(id, payload) => {
              try {
                new PublicKey(payload.address);
                updateAddressMutation.mutate(
                  {
                    id,
                    payload: {
                      name: payload.name,
                      walletAddress: payload.address,
                      network: payload.network,
                    },
                  },
                  {
                    onSuccess: () => toast.success("Contact updated"),
                    onError: (error: unknown) =>
                      toast.error(error instanceof Error ? error.message : "Failed to update contact"),
                  },
                );
              } catch {
                toast.error("Enter a valid address");
              }
            }}
            onDelete={(id) => {
              deleteAddressMutation.mutate(id, {
                onSuccess: () => toast.success("Contact removed"),
                onError: (error: unknown) =>
                  toast.error(error instanceof Error ? error.message : "Failed to remove contact"),
              });
            }}
            onQuickSend={(entry: AddressBookEntry) => {
              setPrefillReceiver(entry.address);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>

      <TransactionHistory transactions={transferTransactions} loading={transactionsQuery.isLoading && connected} />

      <ReceiveModal
        open={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        address={address}
        onCopy={handleCopyAddress}
      />
    </div>
  );
}
