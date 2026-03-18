import { AlertTriangle, ShieldCheck } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import type { TreasuryHealthResponse } from "@/types";
import { formatPercent } from "@/utils/format";

export function TreasuryHealthCard({ data }: { data?: TreasuryHealthResponse }) {
  return (
    <SectionCard title="Treasury Health" description="Reserve resilience, concentration, runway pressure, and dependency checks.">
      {!data?.configured ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center text-sm text-slate-400">
          Treasury health becomes available once treasury configuration and balances are detected.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Health score</div>
                <div className="mt-2 text-3xl font-semibold text-white">{data.score}/100</div>
                <div className="mt-1 text-sm text-cyan-200">{data.label}</div>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 p-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/6">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${data.score || 0}%` }} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Stable reserve strength", data.stableReserveStrength],
              ["Concentration risk", data.concentrationRisk],
              ["Liquid reserve sufficiency", data.liquidReserveSufficiency],
              ["Governance dependency", data.governanceDependency],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
                <div className="mt-2 text-lg font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Spending velocity
            </div>
            <div className="mt-1">{formatPercent(data.spendingVelocity || 0)} of visible treasury value is currently tied to monthly commitments.</div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
