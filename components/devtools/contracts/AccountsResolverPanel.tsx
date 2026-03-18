"use client";

import { FormField } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { shortenAddress } from "@/lib/solana";
import type { ContractConsoleMode, ContractResolvedAccount } from "@/services/contractConsoleService";

export function AccountsResolverPanel({
  accounts,
  mode,
  overrides,
  onOverrideChange,
}: {
  accounts: ContractResolvedAccount[];
  mode: ContractConsoleMode;
  overrides: Record<string, string>;
  onOverrideChange: (name: string, value: string) => void;
}) {
  if (!accounts.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
        Account requirements appear here after selecting a program instruction.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <div key={account.name} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium text-white">{account.label}</div>
            {account.signer ? (
              <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-200">
                signer
              </span>
            ) : null}
            {account.writable ? (
              <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                writable
              </span>
            ) : null}
            <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
              {account.source}
            </span>
          </div>
          <div className="mt-3 text-sm text-slate-300">{account.address ? shortenAddress(account.address) : "Unresolved"}</div>
          <div className="mt-1 break-all text-xs text-slate-500">{account.address || account.note}</div>
          {mode === "raw" || account.source === "missing" ? (
            <div className="mt-3">
              <FormField label="Manual override" htmlFor={`contract-account-${account.name}`}>
                <Input
                  id={`contract-account-${account.name}`}
                  value={overrides[account.name] || ""}
                  onChange={(event) => onOverrideChange(account.name, event.target.value)}
                  placeholder="Paste Solana address"
                />
              </FormField>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
