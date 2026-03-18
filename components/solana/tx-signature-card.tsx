"use client";

import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import type { OnChainActionResult } from "@/types";
import { Button } from "@/components/ui/button";

type TxSignatureCardProps = {
  result: OnChainActionResult;
};

export function TxSignatureCard({ result }: TxSignatureCardProps) {
  if (!result.signature && !result.message) {
    return null;
  }

  return (
    <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            {result.label}
          </div>
          <div className="text-sm text-slate-300">{result.message}</div>
          {result.signature ? (
            <div className="font-mono text-xs text-slate-400">{result.signature}</div>
          ) : null}
        </div>

        <div className="flex gap-2">
          {result.signature ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(result.signature || "");
                toast.success("Transaction signature copied");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy signature
            </Button>
          ) : null}
          {result.explorerUrl ? (
            <Button
              size="sm"
              onClick={() => window.open(result.explorerUrl, "_blank", "noopener,noreferrer")}
            >
              View on Explorer
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
