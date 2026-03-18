"use client";

import { useState } from "react";
import { Download, Play, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContractSavedCall } from "@/services/contractConsoleService";

export function SavedCallsPanel({
  savedCalls,
  onSave,
  onLoad,
  onDelete,
  onExport,
}: {
  savedCalls: ContractSavedCall[];
  onSave: (label: string) => void;
  onLoad: (call: ContractSavedCall) => void;
  onDelete: (id: string) => void;
  onExport: (call: ContractSavedCall) => void;
}) {
  const [label, setLabel] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Save current call preset" />
        <Button
          type="button"
          onClick={() => {
            if (!label.trim()) {
              return;
            }
            onSave(label.trim());
            setLabel("");
          }}
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="space-y-3">
        {savedCalls.length ? (
          savedCalls.map((call) => (
            <div key={call.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{call.label}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {call.programKey} • {call.instructionName}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => onLoad(call)}>
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => onExport(call)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => onDelete(call.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
            No saved call presets yet. Save a frequently used instruction template for faster demos and repeated testing.
          </div>
        )}
      </div>
    </div>
  );
}
