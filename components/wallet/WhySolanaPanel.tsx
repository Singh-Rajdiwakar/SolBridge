"use client";

import { BadgeCheck } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";

export function WhySolanaPanel() {
  return (
    <GlassCard>
      <SectionHeader
        title="Why Solana?"
        subtitle="Design rationale surfaced directly in the product for technical reviewers and recruiters."
        action={<BadgeCheck className="h-4 w-4 text-cyan-300" />}
      />

      <div className="space-y-3">
        {[
          "High throughput blockchain",
          "Extremely low transaction fees",
          "Fast confirmation times",
          "Strong developer ecosystem",
          "Public transaction transparency",
        ].map((item) => (
          <div key={item} className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
            {item}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
