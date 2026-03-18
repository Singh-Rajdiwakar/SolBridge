"use client";

import type { ContractInstructionSummary } from "@/services/contractConsoleService";

export function IDLInspectorPanel({
  data,
}: {
  data: {
    name: string;
    version: string;
    description: string;
    programId: string;
    instructions: ContractInstructionSummary[];
    accounts: string[];
    types: Array<{ name: string; kind: string; variants: string[] }>;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold text-white">{data.name}</div>
        <div className="mt-1 text-xs text-slate-400">v{data.version}</div>
        <p className="mt-3 text-sm leading-6 text-slate-400">{data.description}</p>
        <div className="mt-3 break-all rounded-md border border-white/10 bg-slate-950/40 p-3 font-mono text-xs text-slate-300">
          {data.programId}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Instructions</div>
        <div className="mt-3 space-y-2">
          {data.instructions.map((instruction) => (
            <div key={instruction.name} className="rounded-md border border-white/10 bg-slate-950/40 p-3">
              <div className="text-sm font-medium text-white">{instruction.label}</div>
              <div className="mt-1 text-xs text-slate-400">
                {instruction.requiredArgsCount} args • {instruction.accounts.length} accounts
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Account Definitions</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.accounts.map((account) => (
            <span key={account} className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300">
              {account}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
