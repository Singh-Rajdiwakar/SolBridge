"use client";

import { History, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ContractInstructionHistoryEntry } from "@/services/contractConsoleService";

export function InstructionHistoryPanel({
  history,
  onReplay,
}: {
  history: ContractInstructionHistoryEntry[];
  onReplay: (entry: ContractInstructionHistoryEntry) => void;
}) {
  return (
    <div className="space-y-3">
      {history.length ? (
        history.slice(0, 10).map((entry) => (
          <div key={entry.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">
                  {entry.programKey} / {entry.instructionName}
                </div>
                <div className="mt-1 text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString()}</div>
                <div className={`mt-2 text-xs ${entry.status === "confirmed" ? "text-emerald-300" : "text-rose-300"}`}>
                  {entry.status === "confirmed" ? entry.signature || "Confirmed" : entry.error || "Failed"}
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => onReplay(entry)}>
                <PlayCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
          <div className="flex items-center gap-2 font-medium text-slate-300">
            <History className="h-4 w-4" />
            No instruction history yet
          </div>
          <div className="mt-2">Executed contract calls will appear here with signature status and replay support.</div>
        </div>
      )}
    </div>
  );
}
