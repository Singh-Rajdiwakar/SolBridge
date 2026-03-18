"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/utils/cn";
import type { ContractConsoleProgramKey, ContractConsoleProgramSummary } from "@/services/contractConsoleService";

export function ProgramSelector({
  programs,
  selectedProgramKey,
  onSelect,
}: {
  programs: ContractConsoleProgramSummary[];
  selectedProgramKey: ContractConsoleProgramKey;
  onSelect: (programKey: ContractConsoleProgramKey) => void;
}) {
  return (
    <div className="grid gap-3">
      {programs.map((program) => (
        <button
          key={program.key}
          type="button"
          onClick={() => onSelect(program.key)}
          className={cn(
            "rounded-lg border p-4 text-left transition",
            selectedProgramKey === program.key
              ? "border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]"
              : "border-white/10 bg-white/[0.03] hover:border-cyan-400/18 hover:bg-white/[0.05]",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">{program.label}</div>
              <div className="mt-1 text-xs text-slate-400">{program.shortDescription}</div>
            </div>
            {selectedProgramKey === program.key ? <CheckCircle2 className="h-4 w-4 text-cyan-300" /> : null}
          </div>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            <div>{program.programId}</div>
            <div>
              {program.instructionCount} instructions • {program.accountTypes.length} account types
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
