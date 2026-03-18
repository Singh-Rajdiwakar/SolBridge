"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ProgramLogsViewer({ logs }: { logs: string[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-400">Runtime logs, invocation order, and Anchor debug output.</div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(logs.join("\n"));
            toast.success("Program logs copied.");
          }}
          disabled={!logs.length}
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
      <div className="max-h-[26rem] overflow-auto rounded-lg border border-white/10 bg-slate-950/60 p-4 font-mono text-xs leading-6 text-slate-300">
        {logs.length ? (
          logs.map((line, index) => (
            <div
              key={`${line}-${index}`}
              className={line.toLowerCase().includes("error") ? "text-rose-300" : line.includes("success") ? "text-emerald-300" : ""}
            >
              {line}
            </div>
          ))
        ) : (
          <div className="text-slate-500">No logs yet. Run simulation or send a transaction to inspect runtime output.</div>
        )}
      </div>
    </div>
  );
}
