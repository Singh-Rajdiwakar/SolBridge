"use client";

import { ExternalLink } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StateReaderPanel({
  accountTypes,
  accountType,
  onAccountTypeChange,
  address,
  onAddressChange,
  state,
  loading,
}: {
  accountTypes: string[];
  accountType: string;
  onAccountTypeChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  state?: {
    address: string;
    explorerUrl: string;
    decoded: Record<string, unknown> | null;
    lamports: number;
    owner: string;
    executable: boolean;
  };
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <Select value={accountType} onValueChange={onAccountTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select account type" />
        </SelectTrigger>
        <SelectContent>
          {accountTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input value={address} onChange={(event) => onAddressChange(event.target.value)} placeholder="Paste account address to decode" />

      {loading ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          Fetching and decoding account state...
        </div>
      ) : state ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Metric label="Lamports" value={String(state.lamports)} />
              <Metric label="Executable" value={state.executable ? "Yes" : "No"} />
              <Metric label="Owner" value={state.owner} />
              <Metric label="Address" value={state.address} />
            </div>
            <div className="mt-4">
              <a
                href={state.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white"
              >
                View on Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <pre className="overflow-auto rounded-lg border border-white/10 bg-slate-950/60 p-4 text-xs leading-6 text-slate-300">
            {JSON.stringify(state.decoded, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
          Choose an IDL account type and address to decode on-chain state inside the console.
        </div>
      )}
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
