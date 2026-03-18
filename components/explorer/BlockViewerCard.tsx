"use client";

import { Blocks, Clock3, DatabaseZap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard, SectionHeader } from "@/components/shared";
import type { ExplorerBlockResult } from "@/types";

export function BlockViewerCard({ result }: { result: ExplorerBlockResult }) {
  return (
    <GlassCard className="space-y-5">
      <SectionHeader
        title="Block / Slot Viewer"
        subtitle="Slot-level visibility for transaction density, timing, and program usage."
        action={<Badge variant="success">Slot {result.slot}</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Transactions" value={String(result.transactionCount)} icon={Blocks} />
        <MetricCard label="Fees" value={`${result.totalFeesSol} SOL`} icon={DatabaseZap} />
        <MetricCard label="Block Height" value={String(result.blockHeight || "--")} icon={Blocks} />
        <MetricCard label="Block Time" value={result.blockTime ? new Date(result.blockTime).toLocaleTimeString() : "--"} icon={Clock3} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Key Programs Used</div>
          <div className="space-y-3">
            {result.keyProgramsUsed.length ? (
              result.keyProgramsUsed.slice(0, 8).map((program) => (
                <div key={program.programId} className="flex items-center justify-between rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div>
                    <div className="font-medium text-white">{program.label}</div>
                    <div className="text-xs text-slate-500">{program.protocolModule}</div>
                  </div>
                  <Badge variant="muted">{program.count}</Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">Program visibility was not available for this slot.</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Recent Signatures</div>
          <div className="space-y-3">
            {result.signatures.length ? (
              result.signatures.map((entry) => (
                <div key={entry.signature} className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div className="font-mono text-sm text-white">{entry.shortSignature}</div>
                  <div className="mt-1 text-xs text-slate-500">{entry.status} • fee {entry.feeLamports} lamports</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No parsed signatures were returned for this block.</div>
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
  icon: typeof Blocks;
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
