"use client";

import { useEffect, useMemo, useState } from "react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { motion } from "framer-motion";
import { CheckCircle2, Import, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ModalDialog } from "@/components/dashboard/modal-dialog";
import { NetworkBadge } from "@/components/wallet/NetworkBadge";
import { ProviderChip } from "@/components/wallet/ProviderChip";
import { SecurityBadge } from "@/components/wallet/SecurityBadge";
import { useActiveWallet } from "@/hooks/use-active-wallet";
import { shortenAddress } from "@/lib/solana";
import { useWalletStore } from "@/store/wallet-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const supportedExternalWallets = [
  { name: "Phantom", description: "Crypto-native browser wallet with fast Solana flows." },
  { name: "Solflare", description: "Institutional-ready Solana wallet with mature transaction tooling." },
  { name: "Backpack", description: "Modern multi-asset wallet for active onchain operators." },
  { name: "Coinbase Wallet", description: "Trusted consumer wallet experience with clean onboarding." },
];
const futureWallets = [{ name: "MetaMask", description: "Planned for future multi-chain support." }];

type RetixStep = "welcome" | "create" | "import" | "ready";

export function WalletConnectModal() {
  const {
    address,
    connected,
    providerName,
    availableWallets,
    externalWallet,
    createRetixWallet,
    importRetixWallet,
    connectRetixWallet,
    disconnectRetixWallet,
    selectExternalWallet,
    exportPrivateKey,
  } = useActiveWallet();
  const { connectModalOpen, setConnectModalOpen, retixPublicKey } = useWalletStore();

  const [importValue, setImportValue] = useState("");
  const [pendingExternalWallet, setPendingExternalWallet] = useState<string | null>(null);
  const [retixStep, setRetixStep] = useState<RetixStep>("welcome");
  const [latestRetixAddress, setLatestRetixAddress] = useState<string | null>(retixPublicKey);

  const externalWallets = useMemo(
    () =>
      availableWallets.filter((wallet) =>
        supportedExternalWallets.some((entry) => wallet.adapter.name.includes(entry.name)),
      ),
    [availableWallets],
  );

  useEffect(() => {
    if (!connectModalOpen) {
      return;
    }

    setRetixStep(retixPublicKey ? "ready" : "welcome");
    setLatestRetixAddress(retixPublicKey);
  }, [connectModalOpen, retixPublicKey]);

  useEffect(() => {
    if (!pendingExternalWallet) {
      return;
    }

    if (externalWallet.wallet?.adapter.name !== pendingExternalWallet) {
      return;
    }

    if (externalWallet.connected) {
      toast.success(`${pendingExternalWallet} connected`);
      setPendingExternalWallet(null);
      setConnectModalOpen(false);
      return;
    }

    externalWallet
      .connect()
      .then(() => {
        toast.success(`${pendingExternalWallet} connected`);
        setPendingExternalWallet(null);
        setConnectModalOpen(false);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Wallet connection failed");
        setPendingExternalWallet(null);
      });
  }, [externalWallet, pendingExternalWallet, setConnectModalOpen]);

  return (
    <ModalDialog
      open={connectModalOpen}
      onOpenChange={setConnectModalOpen}
      title="Connect Wallet"
      description="Retix Wallet Pro combines a secure built-in wallet flow with trusted external Solana providers."
      contentClassName="w-[min(96vw,62rem)]"
    >
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26 }}
          className="rounded-xl border border-cyan-400/16 bg-[linear-gradient(180deg,rgba(17,27,49,0.96),rgba(10,16,32,0.92))] p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <NetworkBadge />
            <SecurityBadge />
            <ProviderChip provider="Retix Wallet" />
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Built-in wallet</div>
            <div className="mt-2 text-2xl font-semibold text-white">Retix Wallet</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              Encrypted local key storage, transaction signing, Devnet airdrops, and a first-run flow built for real product demos.
            </div>
          </div>

          <div className="mt-5 flex gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {["Welcome", "Security", "Ready"].map((step, index) => (
              <div
                key={step}
                className={`rounded-md border px-3 py-1.5 ${
                  (retixStep === "welcome" && index === 0) ||
                  ((retixStep === "create" || retixStep === "import") && index === 1) ||
                  (retixStep === "ready" && index === 2)
                    ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.03] text-slate-500"
                }`}
              >
                {step}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            {retixStep === "welcome" ? (
              <div className="space-y-4">
                <div className="text-base font-semibold text-white">Welcome to Retix Wallet</div>
                <div className="text-sm text-slate-400">
                  Create a new encrypted wallet or import an existing private key for Devnet operations.
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setRetixStep("create")}>
                    <Sparkles className="h-4 w-4" />
                    Create New Wallet
                  </Button>
                  <Button variant="secondary" onClick={() => setRetixStep("import")}>
                    <Import className="h-4 w-4" />
                    Import Existing Wallet
                  </Button>
                </div>
              </div>
            ) : null}

            {retixStep === "create" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  Backup Recovery Warning
                </div>
                <div className="text-sm text-slate-400">
                  Retix encrypts your secret key locally. Export and store it securely before using significant balances.
                </div>
                <div className="rounded-lg border border-amber-400/16 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Backup reminder: this demo stores encrypted key material in localStorage. Losing browser storage means losing wallet recovery unless you export the key.
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      const created = createRetixWallet();
                      setLatestRetixAddress(created);
                      setRetixStep("ready");
                      toast.success(`Retix Wallet created: ${shortenAddress(created)}`);
                    }}
                  >
                    Generate Encrypted Wallet
                  </Button>
                  <Button variant="secondary" onClick={() => setRetixStep("welcome")}>
                    Back
                  </Button>
                </div>
              </div>
            ) : null}

            {retixStep === "import" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-semibold text-white">
                  <KeyRound className="h-4 w-4 text-cyan-300" />
                  Import Existing Wallet
                </div>
                <Textarea
                  value={importValue}
                  onChange={(event) => setImportValue(event.target.value)}
                  placeholder="Paste a JSON-array or comma-separated private key"
                  className="min-h-28"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      try {
                        const imported = importRetixWallet(importValue);
                        setLatestRetixAddress(imported);
                        setRetixStep("ready");
                        setImportValue("");
                        toast.success(`Imported ${shortenAddress(imported)}`);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Import failed");
                      }
                    }}
                  >
                    Import Wallet
                  </Button>
                  <Button variant="secondary" onClick={() => setRetixStep("welcome")}>
                    Back
                  </Button>
                </div>
              </div>
            ) : null}

            {retixStep === "ready" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-semibold text-white">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  Wallet Ready
                </div>
                <div className="text-sm text-slate-400">
                  Your encrypted Retix Wallet is ready for sending, receiving, swapping, and minting on Solana Devnet.
                </div>
                <div className="rounded-lg border border-white/10 bg-[#0b1324] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Wallet Address</div>
                  <div className="mt-2 text-base font-semibold text-white">{latestRetixAddress ? shortenAddress(latestRetixAddress) : "--"}</div>
                  <div className="mt-1 break-all text-sm text-slate-400">{latestRetixAddress || retixPublicKey || "No wallet available"}</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => connectRetixWallet()}>Use Retix Wallet</Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const exported = exportPrivateKey();
                      if (!exported) {
                        return;
                      }
                      await navigator.clipboard.writeText(exported);
                      toast.success("Encrypted private key copied");
                    }}
                  >
                    Export Key
                  </Button>
                  {retixPublicKey ? (
                    <Button variant="secondary" onClick={() => disconnectRetixWallet()}>
                      Disconnect
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: 0.03 }}
          className="space-y-4"
        >
          <div className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,27,49,0.94),rgba(10,16,32,0.9))] p-5">
            <div className="text-sm font-semibold text-white">External Wallet Providers</div>
            <div className="mt-1 text-sm text-slate-400">Trusted Solana providers with subtle branding and clear connection state.</div>

            <div className="mt-4 space-y-3">
              {supportedExternalWallets.map((provider) => {
                const wallet = externalWallets.find((entry) => entry.adapter.name.includes(provider.name));
                const ready = wallet?.readyState || "Unsupported";

                return (
                  <button
                    key={provider.name}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-cyan-300/22 hover:bg-white/[0.05]"
                    onClick={() => {
                      if (!wallet) {
                        toast.error(`${provider.name} adapter is not available`);
                        return;
                      }
                      setPendingExternalWallet(wallet.adapter.name);
                      selectExternalWallet();
                      externalWallet.select(wallet.adapter.name as WalletName<string>);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/15 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                        {provider.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{provider.name}</div>
                        <div className="mt-1 max-w-xs text-sm text-slate-400">{provider.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{String(ready)}</div>
                      <div className="mt-2 inline-flex rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-300">
                        {pendingExternalWallet === wallet?.adapter.name ? "Connecting..." : "Connect"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,27,49,0.94),rgba(10,16,32,0.9))] p-5">
            <div className="text-sm font-semibold text-white">Future Wallet Support</div>
            <div className="mt-3 space-y-3">
              {futureWallets.map((wallet) => (
                <button
                  key={wallet.name}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-4 text-left opacity-80"
                  onClick={() => toast.info(`${wallet.name} support is planned for a future release`)}
                >
                  <div>
                    <div className="font-medium text-white">{wallet.name}</div>
                    <div className="mt-1 text-sm text-slate-400">{wallet.description}</div>
                  </div>
                  <div className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-300">Planned</div>
                </button>
              ))}
            </div>
          </div>

          {connected ? (
            <div className="rounded-xl border border-emerald-400/16 bg-emerald-500/8 p-5 text-sm text-emerald-100">
              Connected now: <span className="font-semibold text-white">{providerName}</span> {address ? `(${shortenAddress(address)})` : ""}
            </div>
          ) : null}
        </motion.div>
      </div>
    </ModalDialog>
  );
}
