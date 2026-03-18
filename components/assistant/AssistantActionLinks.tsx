"use client";

import { ExternalLink } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import type { AssistantActionLink } from "@/types";

export function AssistantActionLinks({
  items,
  disclaimer,
}: {
  items: AssistantActionLink[];
  disclaimer: string;
}) {
  return (
    <GlassCard className="h-full">
      <SectionHeader
        title="Suggested Next Actions"
        subtitle="Jump directly into the module most relevant to the current assistant guidance."
        action={<ExternalLink className="h-4 w-4 text-cyan-300" />}
      />
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <a
            key={`${item.intent}-${item.href}`}
            href={item.href}
            className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:border-cyan-400/30 hover:text-cyan-100"
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/8 p-4 text-sm leading-6 text-amber-100">
        {disclaimer}
      </div>
    </GlassCard>
  );
}
