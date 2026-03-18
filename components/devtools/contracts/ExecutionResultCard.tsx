"use client";

import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ContractExecutionResult } from "@/services/contractConsoleService";

export function ExecutionResultCard({ result }: { result: ContractExecutionResult | null }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
        Execution result, signature, slot, and confirmation metadata appear here after sending a transaction.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-400/16 bg-emerald-400/6 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-200">
          {result.status}
        </span>
        {result.slot ? (
          <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            slot {result.slot}
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Metric label="Signature" value={result.signature} />
        <Metric label="Confirmation" value={result.blockTime || "Confirmed"} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void navigator.clipboard.writeText(result.signature);
            toast.success("Transaction signature copied.");
          }}
        >
          <Copy className="h-4 w-4" />
          Copy Signature
        </Button>
        <a
          href={result.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/24 hover:text-white"
        >
          View on Explorer
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/40 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 break-all text-sm font-medium text-white">{value}</div>
    </div>
  );
}
