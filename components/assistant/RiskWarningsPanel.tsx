"use client";

import { ShieldAlert } from "lucide-react";

import { AssistantListPanel } from "@/components/assistant/AssistantListPanel";
import type { AssistantInsightRecord } from "@/types";

export function RiskWarningsPanel({ items }: { items: AssistantInsightRecord[] }) {
  return (
    <AssistantListPanel
      title="Risk Warnings"
      subtitle="Portfolio and protocol risks surfaced from the active risk engine."
      icon={ShieldAlert}
      items={items}
      emptyTitle="No major warnings"
      emptyDescription="Current wallet posture does not trigger material assistant warnings."
    />
  );
}
