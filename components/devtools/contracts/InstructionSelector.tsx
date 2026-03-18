"use client";

import { Pin, ShieldAlert, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/utils/cn";
import type { ContractConsoleProgramKey, ContractInstructionSummary } from "@/services/contractConsoleService";

export function InstructionSelector({
  instructions,
  selectedInstructionName,
  onSelect,
  programKey,
  pinnedInstructionKeys,
  onTogglePin,
}: {
  instructions: ContractInstructionSummary[];
  selectedInstructionName: string;
  onSelect: (instructionName: string) => void;
  programKey: ContractConsoleProgramKey;
  pinnedInstructionKeys: string[];
  onTogglePin: (programKey: ContractConsoleProgramKey, instructionName: string) => void;
}) {
  const active = instructions.find((instruction) => instruction.name === selectedInstructionName) || instructions[0];

  return (
    <div className="space-y-4">
      <Select value={selectedInstructionName} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Choose an instruction" />
        </SelectTrigger>
        <SelectContent>
          {instructions.map((instruction) => (
            <SelectItem key={instruction.name} value={instruction.name}>
              {instruction.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {active ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-white">{active.label}</h3>
                {active.signerRequired ? (
                  <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-200">
                    signer
                  </span>
                ) : null}
                {active.adminOnly ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-200">
                    <ShieldAlert className="h-3 w-3" />
                    admin
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{active.description}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onTogglePin(programKey, active.name)}
            >
              <Pin className="h-4 w-4" />
              {pinnedInstructionKeys.includes(`${programKey}:${active.name}`) ? "Pinned" : "Pin"}
            </Button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-300">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Args</div>
              <div className="mt-2">{active.requiredArgsCount}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-300">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Accounts</div>
              <div className="mt-2">{active.accounts.length}</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {instructions
          .filter((instruction) => pinnedInstructionKeys.includes(`${programKey}:${instruction.name}`))
          .map((instruction) => (
            <button
              key={instruction.name}
              type="button"
              onClick={() => onSelect(instruction.name)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition",
                selectedInstructionName === instruction.name
                  ? "border-cyan-400/24 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-400/16",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {instruction.label}
            </button>
          ))}
      </div>
    </div>
  );
}
