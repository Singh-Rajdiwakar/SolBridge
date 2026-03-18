"use client";

import { Coins } from "lucide-react";

import { AssistantListPanel } from "@/components/assistant/AssistantListPanel";
import type { AssistantInsightRecord } from "@/types";

export function YieldSuggestionsPanel({ items }: { items: AssistantInsightRecord[] }) {
  return (
    <AssistantListPanel
      title="Yield Suggestions"
      subtitle="Rule-based efficiency ideas derived from current balances and modeled protocol yield assumptions."
      icon={Coins}
      items={items}
      emptyTitle="No yield suggestions"
      emptyDescription="The current wallet mix does not present a strong yield optimization signal yet."
    />
  );
}
