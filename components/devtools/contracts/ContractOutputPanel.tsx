"use client";

type OutputItem = {
  label: string;
  value: string;
  explorerUrl?: string;
};

export function ContractOutputPanel({ outputs }: { outputs: OutputItem[] }) {
  if (!outputs.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
        Derived outputs such as created PDAs, proposal accounts, or updated position addresses appear here after execution.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {outputs.map((output) => (
        <div key={`${output.label}-${output.value}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{output.label}</div>
          <div className="mt-2 break-all text-sm font-medium text-white">{output.value}</div>
          {output.explorerUrl ? (
            <a
              href={output.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white"
            >
              View account on Explorer
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}
