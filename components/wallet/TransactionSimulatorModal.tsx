"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

import { ModalDialog } from "@/components/dashboard/modal-dialog";
import { Button } from "@/components/ui/button";
import type { TransactionSimulationResponse } from "@/types";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

export function TransactionSimulatorModal({
  open,
  onOpenChange,
  simulation,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulation?: TransactionSimulationResponse | null;
  loading?: boolean;
  onConfirm: () => void;
}) {
  const blocked = simulation?.addressRisk?.blocked;

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Transaction Simulator"
      description="Preview expected outcomes, fee impact, address risk, and confidence before signing."
      contentClassName="w-[min(94vw,44rem)]"
    >
      {simulation ? (
        <div className="space-y-4">
          <div
            className={cn(
              "rounded-lg border p-4",
              blocked
                ? "border-rose-400/18 bg-rose-500/10"
                : "border-cyan-400/16 bg-cyan-400/8",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Simulation Summary</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  Success Probability {formatNumber(simulation.successProbability, 0)}%
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  Confidence score {formatNumber(simulation.confidenceScore, 0)}%
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {simulation.riskLevel || simulation.addressRisk?.riskLevel || "Safe"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(simulation.expectedResult).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{humanize(key)}</div>
                <div className="mt-2 text-lg font-semibold text-white">{String(value)}</div>
              </div>
            ))}
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Network Fee</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {formatNumber(simulation.networkFee, 6)} SOL
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Price Impact</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {formatNumber(simulation.priceImpact, 2)}%
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Warnings</div>
            <div className="mt-3 space-y-2">
              {simulation.warnings.length > 0 ? (
                simulation.warnings.map((warning) => (
                  <div key={warning} className="flex items-start gap-2 rounded-md border border-white/10 bg-[#0b1324] px-3 py-3 text-sm text-slate-300">
                    {blocked ? (
                      <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-300" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-200" />
                    )}
                    <span>{warning}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-emerald-400/18 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  No material warnings detected.
                </div>
              )}
            </div>
          </div>

          {simulation.gasOptimization ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
              {simulation.gasOptimization.recommendation}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={blocked || loading}>
              {blocked ? "Blocked by AI" : loading ? "Submitting..." : "Confirm Transaction"}
            </Button>
          </div>
        </div>
      ) : null}
    </ModalDialog>
  );
}

function humanize(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (match) => match.toUpperCase());
}
