"use client";

import type { ReactNode } from "react";
import { ActivitySquare, ShieldCheck, Siren, Zap } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import type { GasOptimizationResponse, SecurityAlert, WalletRiskScoreResponse } from "@/types";

function toneClass(score?: number) {
  if (!score) {
    return "text-slate-300";
  }
  if (score >= 90) {
    return "text-emerald-300";
  }
  if (score >= 70) {
    return "text-cyan-200";
  }
  if (score >= 40) {
    return "text-amber-200";
  }
  return "text-rose-300";
}

export function SecurityHudPanel({
  score,
  optimization,
  alerts,
}: {
  score?: WalletRiskScoreResponse;
  optimization?: GasOptimizationResponse;
  alerts: SecurityAlert[];
}) {
  const warningCount = alerts.filter((alert) => alert.severity === "warning" || alert.severity === "danger").length;

  return (
    <GlassCard>
      <SectionHeader
        title="Security HUD"
        subtitle="Risk telemetry, fraud monitor state, and execution readiness in one operational view."
        action={
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-400/14 bg-emerald-500/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.72)]" />
            Active
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <HudMetric
          label="Wallet Score"
          value={score ? `${score.score}/100` : "--"}
          subvalue={score?.riskLevel || "Analyzing"}
          tone={toneClass(score?.score)}
          icon={<ShieldCheck className="h-4 w-4 text-cyan-200" />}
        />
        <HudMetric
          label="Fraud Monitor"
          value={warningCount > 0 ? `${warningCount} warnings` : "Clean"}
          subvalue={warningCount > 0 ? "Review flagged events" : "No escalations"}
          tone={warningCount > 0 ? "text-amber-200" : "text-emerald-300"}
          icon={<Siren className="h-4 w-4 text-cyan-200" />}
        />
        <HudMetric
          label="Gas Optimization"
          value={optimization?.congestionLevel || "Live"}
          subvalue={optimization?.estimatedConfirmationTime || "Monitoring network"}
          tone="text-cyan-200"
          icon={<Zap className="h-4 w-4 text-cyan-200" />}
        />
        <HudMetric
          label="Network Health"
          value={optimization?.networkHealth || "Stable"}
          subvalue={optimization?.recommendation || "Latency nominal"}
          tone="text-slate-100"
          icon={<ActivitySquare className="h-4 w-4 text-cyan-200" />}
        />
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Protection Status</div>
            <div className="mt-2 text-lg font-semibold text-white">Institution-grade wallet monitoring enabled</div>
          </div>
          <div className="hidden rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 sm:block">
            Retix AI
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {[
            { label: "Address verification", active: true },
            { label: "Suspicious route screening", active: true },
            { label: "Execution confidence scoring", active: true },
            { label: "Backup reminder", active: Boolean(score && score.metrics.addressBookCoverage < 45) },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-md border border-white/10 bg-[#0a1324] px-3 py-2.5">
              <span className="text-sm text-slate-300">{item.label}</span>
              <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${item.active ? "text-emerald-300" : "text-slate-500"}`}>
                {item.active ? "Enabled" : "Idle"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function HudMetric({
  label,
  value,
  subvalue,
  tone,
  icon,
}: {
  label: string;
  value: string;
  subvalue: string;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
        {icon}
      </div>
      <div className={`mt-2 text-xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-400">{subvalue}</div>
    </div>
  );
}
