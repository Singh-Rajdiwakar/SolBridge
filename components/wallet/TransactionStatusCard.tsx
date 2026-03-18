"use client";

import { CheckCircle2, LoaderCircle, ShieldCheck, XCircle } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { buildExplorerUrl, shortenAddress } from "@/lib/solana";
import { formatDate } from "@/utils/format";

type TransactionState = {
  status: "Pending" | "Confirmed" | "Failed";
  title: string;
  signature?: string | null;
  timestamp?: string | null;
};

function iconForStatus(status: TransactionState["status"]) {
  if (status === "Confirmed") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-300" />;
  }
  if (status === "Failed") {
    return <XCircle className="h-5 w-5 text-rose-300" />;
  }
  return <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />;
}

export function TransactionStatusCard({
  state,
  onCopySignature,
}: {
  state?: TransactionState | null;
  onCopySignature?: (signature: string) => void;
}) {
  if (!state) {
    return null;
  }

  return (
    <GlassCard>
      <SectionHeader
        title="Transaction Status"
        subtitle="Real-time execution state with signature verification and explorer access."
        action={iconForStatus(state.status)}
      />

      <div className="space-y-4">
        <div
          className={`rounded-lg border p-4 ${
            state.status === "Confirmed"
              ? "border-emerald-400/18 bg-emerald-500/10"
              : state.status === "Failed"
                ? "border-rose-400/18 bg-rose-500/10"
                : "border-cyan-400/16 bg-cyan-400/8"
          }`}
        >
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Execution State</div>
          <div className="mt-2 text-xl font-semibold text-white">{state.title}</div>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            {state.status === "Confirmed"
              ? "Transaction Confirmed • Signature Verified"
              : state.status === "Pending"
                ? "Transaction Pending • Waiting for confirmation"
                : "Transaction Failed • Verification incomplete"}
          </div>
        </div>

        {state.signature ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Signature</div>
            <div className="mt-2 text-sm font-semibold text-white">{shortenAddress(state.signature)}</div>
            <div className="mt-1 break-all text-sm text-slate-400">{state.signature}</div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => onCopySignature?.(state.signature!)}>
                Copy
              </Button>
              <a
                href={buildExplorerUrl(state.signature)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-300/24 hover:text-white"
              >
                View on Solana Explorer
              </a>
            </div>
          </div>
        ) : null}

        {state.timestamp ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            Timestamp: {formatDate(state.timestamp)}
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
