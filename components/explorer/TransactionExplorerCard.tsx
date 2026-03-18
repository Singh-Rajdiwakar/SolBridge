"use client";

import { CheckCircle2, DatabaseZap, ReceiptText, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard, SectionHeader } from "@/components/shared";
import { getExplorerProtocolTone } from "@/lib/solana/txParser";
import type { ExplorerTransactionResult } from "@/types";

export function TransactionExplorerCard({ result }: { result: ExplorerTransactionResult }) {
  return (
    <GlassCard className="space-y-5">
      <SectionHeader
        title="Transaction Summary"
        subtitle="Parsed instruction visibility, protocol classification, and signer verification."
        action={<Badge variant={result.status === "Confirmed" ? "success" : "danger"}>{result.status}</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Protocol" value={result.protocolClassification} icon={ShieldCheck} />
        <MetricCard label="Slot" value={String(result.slot)} icon={DatabaseZap} />
        <MetricCard label="Instructions" value={String(result.instructionCount)} icon={ReceiptText} />
        <MetricCard label="Fee" value={`${result.feeSol} SOL`} icon={CheckCircle2} />
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Program Visibility</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {result.programIds.map((program) => (
            <span
              key={program.programId}
              className={`inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getExplorerProtocolTone(program.badge)}`}
            >
              {program.badge}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Signer Addresses</div>
          <div className="space-y-3">
            {result.signerAddresses.map((signer) => (
              <div key={signer.address} className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
                <div className="font-medium text-white">{signer.label}</div>
                <div className="font-mono text-xs text-slate-500">{signer.address}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Transfer Summary</div>
          <div className="space-y-3">
            {result.transferSummary.length ? (
              result.transferSummary.map((transfer, index) => (
                <div key={`${transfer.kind}-${index}`} className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-white">{transfer.kind.replace(/-/g, " ")}</div>
                    <Badge variant="muted">{transfer.amount} {transfer.symbol}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {transfer.source ? `${transfer.source.slice(0, 8)}…` : "Program"} → {transfer.destination ? `${transfer.destination.slice(0, 8)}…` : "Destination"}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">Parsed transfer instructions were not available for this signature.</div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-4 w-4 text-cyan-300" />
        {label}
      </div>
      <div className="mt-3 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
