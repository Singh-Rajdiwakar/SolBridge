"use client";

import { Code2, Layers3 } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExplorerProtocolTone } from "@/lib/solana/txParser";
import type { ExplorerTransactionResult } from "@/types";

export function TransactionDetailsPanel({ result }: { result: ExplorerTransactionResult }) {
  return (
    <GlassCard className="space-y-4">
      <SectionHeader
        title="Transaction Details"
        subtitle="Switch between parsed summaries and raw instruction/account visibility."
      />

      <Tabs defaultValue="parsed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="parsed">Parsed</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>

        <TabsContent value="parsed" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                <Layers3 className="h-4 w-4 text-cyan-300" />
                Parsed Instructions
              </div>
              <div className="space-y-3">
                {result.instructions.map((instruction) => (
                  <div key={`${instruction.programId}-${instruction.index}`} className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getExplorerProtocolTone(instruction.protocolModule)}`}>
                        {instruction.protocolModule}
                      </span>
                      <span className="text-sm font-semibold text-white">{instruction.type}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{instruction.summary}</div>
                    <div className="mt-2 font-mono text-xs text-slate-500">{instruction.programId}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Program IDs Used</div>
              <div className="space-y-3">
                {result.programIds.map((program) => (
                  <div key={program.programId} className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getExplorerProtocolTone(program.badge)}`}>
                        {program.badge}
                      </span>
                      <div className="text-sm font-semibold text-white">{program.label}</div>
                    </div>
                    <div className="mt-2 font-mono text-xs text-slate-500">{program.programId}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                <Code2 className="h-4 w-4 text-cyan-300" />
                Involved Accounts
              </div>
              <div className="space-y-3">
                {result.involvedAccounts.map((account) => (
                  <div key={account.address} className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-white">{account.label}</div>
                      {account.signer ? <span className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">Signer</span> : null}
                    </div>
                    <div className="mt-2 font-mono text-xs text-slate-500">{account.address}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Raw Meta</div>
              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Compute Units</div>
                  <div className="mt-1 text-white">{result.rawMeta.computeUnitsConsumed ?? "--"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Pre Balances</div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{result.rawMeta.preBalances.join(", ") || "--"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Post Balances</div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{result.rawMeta.postBalances.join(", ") || "--"}</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
}
