"use client";

import { ActivitySquare, ArrowRightLeft, ChartColumnBig, Wallet } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";

const ICONS = [Wallet, ArrowRightLeft, ChartColumnBig, ActivitySquare];

export function ProtocolImpactPanel({ summary, items }: { summary?: string; items?: string[] }) {
  return (
    <GlassCard>
      <SectionHeader
        title="Protocol Impact"
        subtitle="How current Solana network conditions are likely to affect wallet, trading, and protocol interaction UX."
      />
      <div className="rounded-lg border border-cyan-400/14 bg-cyan-500/6 p-4 text-sm text-slate-200">
        {summary || "Evaluating how network conditions affect the product experience."}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(items || []).map((item, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <div key={item} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md border border-white/10 bg-white/[0.04] p-2">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <div className="text-sm leading-6 text-slate-300">{item}</div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
