"use client";

import { AlertTriangle, PlayCircle, RefreshCcw, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/solana";
import type { ContractInstructionSummary, ContractPreviewSummary, ContractSimulationResult } from "@/services/contractConsoleService";

export function TransactionPreviewCard({
  programLabel,
  instruction,
  preview,
  simulation,
  walletAddress,
  onSimulate,
  onExecute,
  onReset,
  simulating,
  executing,
}: {
  programLabel: string;
  instruction: ContractInstructionSummary | null;
  preview?: ContractPreviewSummary;
  simulation?: ContractSimulationResult | null;
  walletAddress?: string | null;
  onSimulate: () => void;
  onExecute: () => void;
  onReset: () => void;
  simulating: boolean;
  executing: boolean;
}) {
  if (!instruction) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
        Choose a program and instruction to preview the payload, required accounts, simulation output, and execution controls.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-200">
            {programLabel}
          </span>
          <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            {instruction.label}
          </span>
          {instruction.cautionLevel !== "safe" ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-200">
              <AlertTriangle className="h-3 w-3" />
              {instruction.cautionLevel}
            </span>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Metric label="Signer Wallet" value={walletAddress ? shortenAddress(walletAddress) : "Connect wallet"} />
          <Metric
            label="Estimated Fee"
            value={preview ? `${preview.estimatedFeeLamports} lamports` : "--"}
          />
          <Metric label="Unresolved Accounts" value={String(preview?.unresolvedCount ?? 0)} />
        </div>
        {simulation ? (
          <div className="mt-4 rounded-md border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-300">
            <div className="font-medium text-white">{simulation.success ? "Simulation passed" : "Simulation returned error"}</div>
            <div className="mt-1 text-slate-400">
              {simulation.unitsConsumed ? `${simulation.unitsConsumed} compute units` : "No compute unit data"}
            </div>
            {simulation.error ? <div className="mt-2 text-rose-300">{simulation.error}</div> : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onSimulate} disabled={simulating || executing}>
          <PlayCircle className="h-4 w-4" />
          {simulating ? "Simulating..." : "Simulate"}
        </Button>
        <Button type="button" onClick={onExecute} disabled={simulating || executing}>
          <SendHorizontal className="h-4 w-4" />
          {executing ? "Executing..." : "Execute Transaction"}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset} disabled={simulating || executing}>
          <RefreshCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/40 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
