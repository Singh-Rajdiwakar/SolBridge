"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Activity, ExternalLink, Search, TerminalSquare, Wallet } from "lucide-react";

import { SmartContractConsoleHub } from "@/components/devtools/contracts";
import { MiniExplorerHub } from "@/components/explorer";
import { NetworkMonitorHub } from "@/components/network";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NetworkPerformanceCard, WalletTerminalDrawer } from "@/components/wallet";
import { FormField, GlassCard, SectionHeader } from "@/components/shared";
import { useWalletData } from "@/hooks/use-wallet-data";
import { buildExplorerAddressUrl, buildExplorerUrl, DEFAULT_SOL_FEE } from "@/lib/solana";
import { decodeTransactionSignature, getChainTransactions, getNetworkStatus } from "@/services/solanaService";

export default function DevtoolsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (() => {
    const tab = searchParams.get("tab");
    if (tab === "explorer" || tab === "contracts" || tab === "network") {
      return tab;
    }
    return "diagnostics";
  })();
  const {
    wallet,
    connected,
    address,
    providerName,
    portfolioTokens,
    insightsQuery,
    balanceQuery,
    latencyMs,
  } = useWalletData();
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [walletSearch, setWalletSearch] = useState(address || "");
  const [txSearch, setTxSearch] = useState("");
  const [debugSignature, setDebugSignature] = useState("");

  const networkStatusQuery = useQuery({
    queryKey: ["devtools", "network-status"],
    queryFn: getNetworkStatus,
    staleTime: 1000 * 30,
  });

  const chainTransactionsQuery = useQuery({
    queryKey: ["devtools", "chain-transactions", address],
    queryFn: () => getChainTransactions(address!, 6),
    enabled: Boolean(address),
  });

  const debuggerQuery = useQuery({
    queryKey: ["devtools", "debugger", debugSignature],
    queryFn: () => decodeTransactionSignature(debugSignature),
    enabled: debugSignature.trim().length > 20,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Tools"
        subtitle="Internal mini explorer, RPC diagnostics, terminal mode, and transaction inspection for blockchain transparency demos and protocol debugging."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/dev/blockchain-check" className={buttonVariants({ variant: "secondary" })}>
              <Activity className="h-4 w-4" />
              Blockchain Check
            </Link>
            <Button variant="secondary" onClick={() => setTerminalOpen(true)}>
              <TerminalSquare className="h-4 w-4" />
              Terminal Mode
            </Button>
            <Button onClick={wallet.openConnectModal}>
              <Wallet className="h-4 w-4" />
              {connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (value === "explorer") {
            router.replace("/dashboard/devtools?tab=explorer");
            return;
          }
          if (value === "contracts") {
            router.replace("/dashboard/devtools?tab=contracts");
            return;
          }
          if (value === "network") {
            router.replace("/dashboard/devtools?tab=network");
            return;
          }
          router.replace("/dashboard/devtools");
        }}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="explorer">Mini Explorer</TabsTrigger>
          <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer" className="space-y-6">
          <MiniExplorerHub />
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <SmartContractConsoleHub />
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <NetworkMonitorHub />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-6">
              <GlassCard>
                <SectionHeader
                  title="Explorer Shortcuts"
                  subtitle="Direct links for quick external verification while keeping the in-app explorer available."
                  action={<Search className="h-4 w-4 text-cyan-300" />}
                />
                <div className="space-y-4">
                  <FormField label="Wallet Address" htmlFor="devtools-wallet-search">
                    <Input
                      id="devtools-wallet-search"
                      value={walletSearch}
                      onChange={(event) => setWalletSearch(event.target.value)}
                      placeholder="Enter a wallet address"
                    />
                  </FormField>
                  <FormField label="Transaction Signature" htmlFor="devtools-tx-search">
                    <Input
                      id="devtools-tx-search"
                      value={txSearch}
                      onChange={(event) => setTxSearch(event.target.value)}
                      placeholder="Enter a transaction signature"
                    />
                  </FormField>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={walletSearch ? buildExplorerAddressUrl(walletSearch) : "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 transition ${
                        walletSearch ? "hover:border-cyan-300/24 hover:text-white" : "pointer-events-none opacity-50"
                      }`}
                    >
                      Wallet Explorer
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={txSearch ? buildExplorerUrl(txSearch) : "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 transition ${
                        txSearch ? "hover:border-cyan-300/24 hover:text-white" : "pointer-events-none opacity-50"
                      }`}
                    >
                      Transaction Explorer
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <SectionHeader
                  title="Transaction Debugger"
                  subtitle="Paste a signature to inspect parsed transaction metadata from Solana Devnet."
                />
                <div className="space-y-4">
                  <Input
                    value={debugSignature}
                    onChange={(event) => setDebugSignature(event.target.value)}
                    placeholder="Paste transaction signature"
                  />
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    {debuggerQuery.data ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DebugMetric label="Status" value={debuggerQuery.data.status} />
                        <DebugMetric label="Slot" value={String(debuggerQuery.data.slot)} />
                        <DebugMetric label="Instructions" value={String(debuggerQuery.data.instructions)} />
                        <DebugMetric label="Signer Count" value={String(debuggerQuery.data.signerCount)} />
                        <DebugMetric label="Fee (lamports)" value={String(debuggerQuery.data.feeLamports)} />
                        <DebugMetric label="Block Time" value={String(debuggerQuery.data.blockTime || "--")} />
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">Enter a signature to decode transaction metadata.</div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="space-y-6">
              <NetworkPerformanceCard
                latencyMs={networkStatusQuery.data?.latencyMs || latencyMs}
                feeEstimate={DEFAULT_SOL_FEE}
                rpcStatus={networkStatusQuery.data?.rpcStatus}
                blockHeight={networkStatusQuery.data?.blockHeight}
              />

              <GlassCard>
                <SectionHeader
                  title="RPC Tester"
                  subtitle="Live RPC heartbeat, block height, and client version straight from the active endpoint."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <DebugMetric label="RPC Status" value={networkStatusQuery.data?.rpcStatus || "Checking"} />
                  <DebugMetric label="Latency" value={`${networkStatusQuery.data?.latencyMs || latencyMs} ms`} />
                  <DebugMetric label="Block Height" value={String(networkStatusQuery.data?.blockHeight || "--")} />
                  <DebugMetric label="Core Version" value={networkStatusQuery.data?.version || "--"} />
                </div>
              </GlassCard>

              <GlassCard>
                <SectionHeader
                  title="Recent Chain Activity"
                  subtitle="Latest signatures fetched for the connected wallet from Solana Devnet."
                />
                <div className="space-y-3">
                  {chainTransactionsQuery.data?.length ? (
                    chainTransactionsQuery.data.map((tx) => (
                      <div key={tx.signature} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-sm font-semibold text-white">{tx.signature.slice(0, 18)}...</div>
                        <div className="mt-1 text-sm text-slate-400">
                          Slot {tx.slot} • {tx.confirmationStatus || "confirmed"}
                        </div>
                        <div className="mt-3">
                          <a
                            href={buildExplorerUrl(tx.signature)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white"
                          >
                            View on Explorer
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
                      Connect a wallet to inspect recent on-chain signatures.
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <WalletTerminalDrawer
        open={terminalOpen}
        onOpenChange={setTerminalOpen}
        address={address}
        balanceSol={balanceQuery.data?.balanceSol || 0}
        tokens={portfolioTokens}
        insights={insightsQuery.data}
        providerName={providerName || "Retix Wallet"}
      />
    </div>
  );
}

function DebugMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
