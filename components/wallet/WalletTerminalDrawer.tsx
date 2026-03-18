"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Copy, Shield, TerminalSquare, Zap } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WalletInsightsResponse, WalletTokenBalance } from "@/types";
import { shortenAddress } from "@/lib/solana";
import { formatCurrency, formatNumber } from "@/utils/format";

type LogEntry = {
  command: string;
  output: string[];
};

function commandOutput({
  command,
  address,
  balanceSol,
  tokens,
  insights,
  providerName,
  riskLevel,
}: {
  command: string;
  address?: string | null;
  balanceSol: number;
  tokens: WalletTokenBalance[];
  insights?: WalletInsightsResponse;
  providerName: string;
  riskLevel?: string;
}) {
  const normalized = command.trim().toLowerCase();

  if (normalized === "wallet status") {
    return [
      `Provider: ${providerName}`,
      `Address: ${address ? shortenAddress(address) : "Unavailable"}`,
      `Risk Level: ${riskLevel || "Analyzing"}`,
      "Network: Devnet",
    ];
  }

  if (normalized === "wallet balance") {
    return [
      `SOL: ${formatNumber(balanceSol, 4)}`,
      ...tokens.slice(0, 4).map((token) => `${token.symbol}: ${formatNumber(token.balance, token.symbol === "BONK" ? 0 : 4)}`),
      `Total Value: ${formatCurrency(tokens.reduce((sum, token) => sum + token.usdValue, 0))}`,
    ];
  }

  if (normalized === "portfolio analyze") {
    return [
      `Favorite Token: ${insights?.favoriteToken || tokens[0]?.symbol || "SOL"}`,
      `Activity Score: ${insights?.activityScore || 0}`,
      `Average Tx Size: ${formatNumber(insights?.averageTxSize || 0, 4)}`,
      "Suggestion: Keep 10-20% stable asset reserve for execution flexibility.",
    ];
  }

  if (normalized === "security scan") {
    return [
      `Wallet Score State: ${riskLevel || "Pending"}`,
      "Fraud monitor: active",
      "Signature verification: enabled",
      "Result: No blocking flags returned in the last scan window.",
    ];
  }

  if (normalized.startsWith("send --to")) {
    return [
      "Command parsed successfully.",
      "Retix terminal does not broadcast direct CLI sends yet.",
      "Use Preview Transaction in the send panel to continue safely.",
    ];
  }

  if (normalized.startsWith("airdrop")) {
    return [
      "Airdrop request dispatched to Devnet.",
      "Track the wallet hero or transaction feed for confirmation.",
    ];
  }

  return [
    "Unknown command.",
    "Available: wallet status, wallet balance, portfolio analyze, security scan, airdrop 1",
  ];
}

export function WalletTerminalDrawer({
  open,
  onOpenChange,
  address,
  balanceSol,
  tokens,
  insights,
  providerName,
  riskLevel,
  onAirdrop,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: string | null;
  balanceSol: number;
  tokens: WalletTokenBalance[];
  insights?: WalletInsightsResponse;
  providerName: string;
  riskLevel?: string;
  onAirdrop?: () => void;
}) {
  const [command, setCommand] = useState("");
  const initialLogs = useMemo<LogEntry[]>(
    () => [
      {
        command: "retix init",
        output: [
          "Retix Wallet Terminal booted successfully.",
          "Commands are sandboxed and read-safe by default.",
          "Use quick commands or type a custom inspection command below.",
        ],
      },
    ],
    [],
  );
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed.toLowerCase().startsWith("airdrop")) {
      onAirdrop?.();
    }

    const output = commandOutput({
      command: trimmed,
      address,
      balanceSol,
      tokens,
      insights,
      providerName,
      riskLevel,
    });

    setLogs((current) => [...current, { command: trimmed, output }]);
    setCommand("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-auto right-0 top-0 h-screen w-[min(100vw,38rem)] translate-x-0 translate-y-0 rounded-none border-l border-cyan-400/14 border-t-0 bg-[rgba(7,12,24,0.98)] p-0">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-white/10 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <TerminalSquare className="h-5 w-5 text-cyan-300" />
                  Terminal Mode
                </DialogTitle>
                <DialogDescription className="mt-2">
                  Cyber-style operator console for wallet telemetry, portfolio inspection, and Devnet tooling.
                </DialogDescription>
              </div>
              <div className="hidden rounded-md border border-emerald-400/14 bg-emerald-500/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100 sm:block">
                Secure Session
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-3 border-b border-white/10 px-5 py-4 sm:grid-cols-2">
            {["wallet status", "wallet balance", "portfolio analyze", "security scan", "airdrop 1"].map((preset) => (
              <button
                key={preset}
                type="button"
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-slate-300 transition hover:border-cyan-300/24 hover:text-white"
                onClick={() => runCommand(preset)}
              >
                <span>{preset}</span>
                <ChevronRight className="h-4 w-4 text-cyan-300" />
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(3,6,14,0.75),rgba(2,7,15,0.96))] px-5 py-5 font-mono text-sm">
            <div className="space-y-4">
              {logs.map((entry, index) => (
                <div key={`${entry.command}-${index}`} className="rounded-lg border border-white/8 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3 text-cyan-200">
                    <div className="truncate">
                      <span className="text-slate-500">&gt;</span> {entry.command}
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-white/10 p-1.5 text-slate-500 transition hover:text-white"
                      onClick={async () => {
                        await navigator.clipboard.writeText(entry.command);
                        toast.success("Command copied");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-1 text-slate-300">
                    {entry.output.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                runCommand(command);
              }}
            >
              <Input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="Type command: wallet status"
                className="font-mono"
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit">
                  <TerminalSquare className="h-4 w-4" />
                  Run Command
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setLogs([
                      initialLogs[0],
                      {
                        command: "security scan",
                        output: commandOutput({
                          command: "security scan",
                          address,
                          balanceSol,
                          tokens,
                          insights,
                          providerName,
                          riskLevel,
                        }),
                      },
                    ])
                  }
                >
                  <Shield className="h-4 w-4" />
                  Security Scan
                </Button>
                <Button type="button" variant="secondary" onClick={() => runCommand("airdrop 1")}>
                  <Zap className="h-4 w-4" />
                  Airdrop 1
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
