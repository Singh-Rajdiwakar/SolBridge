"use client";

import { PieChart } from "lucide-react";

import { AssistantListPanel } from "@/components/assistant/AssistantListPanel";
import type { AssistantInsightRecord } from "@/types";

export function PortfolioInsightsPanel({ items }: { items: AssistantInsightRecord[] }) {
  return (
    <AssistantListPanel
      title="Portfolio Insights"
      subtitle="Readable allocation, exposure, and activity observations generated from current wallet state."
      icon={PieChart}
      items={items}
      emptyTitle="No portfolio insights"
      emptyDescription="The assistant needs wallet balances and activity data before portfolio insights can be generated."
    />
  );
}
