"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CheckCircle2, Cpu, ExternalLink, Link2, Wallet } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { useActiveWallet } from "@/hooks/use-active-wallet";
import { buildExplorerAddressUrl, shortenAddress } from "@/lib/solana";
import {
  estimateTransactionFee,
  getBalance,
  getChainTransactions,
  getTokenAccountsOnChain,
} from "@/services/solanaService";

function CheckCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: "OK" | "Waiting" | "Ready";
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            status === "OK"
              ? "border border-emerald-400/16 bg-emerald-500/10 text-emerald-100"
              : status === "Ready"
                ? "border border-cyan-400/16 bg-cyan-400/10 text-cyan-100"
                : "border border-amber-400/16 bg-amber-500/10 text-amber-100"
          }`}
        >
          {status}
        </div>
      </div>
      <div className="mt-2 text-sm text-slate-400">{detail}</div>
    </div>
  );
}

export default function BlockchainCheckPage() {
  const { connected, address, providerName, openConnectModal, signAndSendTransaction } = useActiveWallet();

  const balanceQuery = useQuery({
    queryKey: ["dev-check", "balance", address],
    queryFn: () => getBalance(address!),
    enabled: Boolean(address),
  });

  const feeQuery = useQuery({
    queryKey: ["dev-check", "fee", address],
    queryFn: () => estimateTransactionFee({ fromAddress: address || undefined }),
    enabled: true,
  });

  const tokenAccountsQuery = useQuery({
    queryKey: ["dev-check", "token-accounts", address],
    queryFn: () => getTokenAccountsOnChain(address!),
    enabled: Boolean(address),
  });

  const chainTransactionsQuery = useQuery({
    queryKey: ["dev-check", "chain-tx", address],
    queryFn: () => getChainTransactions(address!, 5),
    enabled: Boolean(address),
  });

  const checks = [
    {
      label: "Wallet Connection",
      status: connected ? ("OK" as const) : ("Waiting" as const),
      detail: connected
        ? `${providerName || "Wallet"} connected as ${shortenAddress(address)}`
        : "Connect Retix Wallet, Phantom, Solflare, or Backpack to run live checks.",
    },
    {
      label: "Balance Retrieval",
      status: balanceQuery.data ? ("OK" as const) : ("Waiting" as const),
      detail: balanceQuery.data
        ? `SOL balance fetched from Solana Devnet: ${balanceQuery.data.balanceSol.toFixed(4)} SOL`
        : "Waiting for a connected wallet address before querying Devnet balance.",
    },
    {
      label: "Transaction Fee Estimation",
      status: feeQuery.data ? ("OK" as const) : ("Waiting" as const),
      detail: feeQuery.data
        ? `Estimated fee preview available: ${feeQuery.data.toFixed(6)} SOL`
        : "Fee estimator has not returned yet.",
    },
    {
      label: "Token Accounts",
      status: tokenAccountsQuery.data ? ("OK" as const) : ("Waiting" as const),
      detail: tokenAccountsQuery.data
        ? `Fetched ${tokenAccountsQuery.data.length} parsed token account(s) using @solana/spl-token + web3 tooling.`
        : "Connect a wallet to inspect SPL token accounts on chain.",
    },
    {
      label: "Transaction Send",
      status: connected && Boolean(signAndSendTransaction) ? ("Ready" as const) : ("Waiting" as const),
      detail: connected
        ? "Client signing flow is ready from the wallet dashboard send panel."
        : "Signing is enabled after wallet connection.",
    },
    {
      label: "SPL Token Mint",
      status: connected ? ("Ready" as const) : ("Waiting" as const),
      detail: connected
        ? "Mint flow is available from the Create SPL Token panel on the wallet dashboard."
        : "Connect a wallet to unlock Devnet mint creation.",
    },
    {
      label: "Explorer Verification",
      status: address ? ("OK" as const) : ("Waiting" as const),
      detail: address
        ? "Wallet address and transaction signatures can be verified publicly on Solana Explorer."
        : "Explorer verification is available once a wallet address exists.",
    },
    {
      label: "Recent Chain Transactions",
      status: chainTransactionsQuery.data ? ("OK" as const) : ("Waiting" as const),
      detail: chainTransactionsQuery.data
        ? `Fetched ${chainTransactionsQuery.data.length} recent on-chain signature records for this wallet.`
        : "Waiting for wallet address to query recent signatures.",
    },
  ];

  return (
    <div className="min-h-screen bg-blue-grid px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Blockchain Check"
          subtitle="Developer-facing verification page that proves live Solana integration, explorer transparency, and wallet readiness."
          action={
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={openConnectModal}>
                <Wallet className="h-4 w-4" />
                {connected ? "Switch Wallet" : "Connect Wallet"}
              </Button>
              <Link href="/dashboard/wallet" className={buttonVariants({ variant: "default" })}>
                <ArrowUpRight className="h-4 w-4" />
                Open Wallet
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 rounded-xl border border-cyan-400/16 bg-[rgba(8,12,24,0.92)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.42)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Cpu className="h-4 w-4 text-cyan-300" />
              Retix Wallet Verification Report
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {checks.map((check) => (
                <CheckCard key={check.label} label={check.label} status={check.status} detail={check.detail} />
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-xl border border-white/10 bg-[rgba(8,12,24,0.92)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.42)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Live Verification
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Connected Provider</div>
                <div className="mt-2 text-lg font-semibold text-white">{providerName || "Not connected"}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Wallet Address</div>
                <div className="mt-2 break-all text-sm text-white">{address || "Connect a wallet to continue"}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Explorer Verification</div>
                {address ? (
                  <a
                    href={buildExplorerAddressUrl(address)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white"
                  >
                    View wallet on Solana Explorer
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <div className="mt-2 text-sm text-slate-400">Connect a wallet first</div>
                )}
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Why This Matters</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  This page proves the project is not only styled like a Web3 product. It uses Solana SDKs, exposes
                  public explorer verification, and demonstrates low-fee, high-performance wallet primitives directly in the UI.
                </div>
              </div>
              <Link href="/dashboard/wallet" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white">
                <Link2 className="h-4 w-4" />
                Continue to full wallet dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
