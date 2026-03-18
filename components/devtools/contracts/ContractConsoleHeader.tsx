"use client";

import { BadgeCheck, Cpu, FileCode2, Wallet } from "lucide-react";

import { GlassCard } from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import { shortenAddress } from "@/lib/solana";
import type { ContractConsoleMode } from "@/services/contractConsoleService";

export function ContractConsoleHeader({
  mode,
  onModeChange,
  connected,
  walletAddress,
  providerName,
  selectedProgramLabel,
}: {
  mode: ContractConsoleMode;
  onModeChange: (mode: ContractConsoleMode) => void;
  connected: boolean;
  walletAddress?: string | null;
  providerName?: string | null;
  selectedProgramLabel: string;
}) {
  return (
    <GlassCard className="overflow-hidden border-cyan-400/16 bg-[linear-gradient(135deg,rgba(11,19,38,0.98),rgba(7,12,24,0.96))]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-md border border-cyan-400/16 bg-cyan-400/8 px-3 py-1 text-cyan-200">
              <FileCode2 className="h-3.5 w-3.5" />
              Smart Contract Console
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-emerald-400/18 bg-emerald-400/10 px-3 py-1 text-emerald-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              Anchor IDL loaded
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1 text-slate-300">
              <Cpu className="h-3.5 w-3.5" />
              On-chain execution
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-white">Smart Contract Interaction Console</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              IDL-driven instruction builder for manual Solana program calls, simulation, execution,
              state reads, and runtime log inspection. Current program focus: {selectedProgramLabel}.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[25rem]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Wallet Context</div>
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-white">
              <Wallet className="h-4 w-4 text-cyan-300" />
              {connected ? shortenAddress(walletAddress) : "Disconnected"}
            </div>
            <div className="mt-1 text-sm text-slate-400">{providerName || "Connect a wallet to execute"}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Console Mode</div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">
                  {mode === "friendly" ? "Friendly Mode" : "Raw Mode"}
                </div>
                <div className="text-xs text-slate-400">
                  {mode === "friendly"
                    ? "Auto-derived PDAs and safer defaults"
                    : "Manual accounts and advanced debugging"}
                </div>
              </div>
              <Switch checked={mode === "raw"} onCheckedChange={(checked) => onModeChange(checked ? "raw" : "friendly")} />
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
