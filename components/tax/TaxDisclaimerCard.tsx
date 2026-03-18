"use client";

import { Info } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";

export function TaxDisclaimerCard({ disclaimer, warnings }: { disclaimer?: string; warnings?: string[] }) {
  return (
    <SectionCard
      title="Report Notes"
      description="Important assumptions, historical pricing limitations, and professional usage notice."
      action={<Info className="h-4 w-4 text-cyan-300" />}
    >
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        {disclaimer || "This report is informational only and should be verified independently."}
      </div>
      {warnings?.length ? (
        <div className="mt-4 space-y-2">
          {warnings.map((warning) => (
            <div key={warning} className="rounded-lg border border-amber-400/15 bg-amber-500/8 p-3 text-sm text-amber-200">
              {warning}
            </div>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
