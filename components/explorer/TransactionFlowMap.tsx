"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightLeft, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard, SectionHeader } from "@/components/shared";
import type { ExplorerTransactionFlow } from "@/types";

export function TransactionFlowMap({ flow }: { flow?: ExplorerTransactionFlow | null }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <GlassCard className="space-y-5">
      <SectionHeader
        title="Transaction Flow Map"
        subtitle="Structured path view for signer, program touch, destination, and confirmation."
        action={flow ? <Badge variant="success">{flow.protocolClassification}</Badge> : <ArrowRightLeft className="h-4 w-4 text-cyan-300" />}
      />

      {flow ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Confirmation" value={flow.status} />
            <Metric label="Fee" value={`${flow.feeSol} SOL`} />
            <Metric label="Block Time" value={flow.blockTime ? new Date(flow.blockTime).toLocaleTimeString() : "--"} />
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(17,27,49,0.82),rgba(7,12,24,0.95))] p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
              {flow.nodes.map((node, index) => (
                <div key={node.id} className="contents">
                  <motion.div
                    className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{node.type}</div>
                    <div className="mt-2 text-base font-semibold text-white">{node.label}</div>
                    <div className="mt-1 text-sm text-slate-400">{node.subtitle}</div>
                  </motion.div>
                  {index < flow.nodes.length - 1 ? (
                    <div className="hidden items-center justify-center lg:flex">
                      <motion.div
                        className="relative h-0.5 w-16 bg-cyan-400/25"
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [0.35, 0.8, 0.35] }}
                        transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      >
                        <motion.div
                          className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-300"
                          animate={prefersReducedMotion ? { x: 28 } : { x: [0, 56, 0] }}
                          transition={{ duration: 2.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        />
                      </motion.div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {flow.steps.map((step, index) => (
              <motion.div
                key={step.id}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.28, ease: "easeOut" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{step.label}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {step.from.slice(0, 8)}… → {step.to.slice(0, 8)}…
                    </div>
                  </div>
                  <div className="text-sm font-medium text-cyan-100">{step.value || "Confirmed step"}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            <Link2 className="h-5 w-5" />
          </div>
          <div className="text-lg font-semibold text-white">Flow map idle</div>
          <div className="max-w-sm text-sm text-slate-400">
            Search a transaction signature to inspect signer, program path, destination, and confirmation flow.
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
