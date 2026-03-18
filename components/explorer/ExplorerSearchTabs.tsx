"use client";

import { SearchCode, ScanSearch, ScrollText, Wallet } from "lucide-react";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExplorerSearchType } from "@/types";

const SEARCH_TABS: Array<{
  value: ExplorerSearchType;
  label: string;
  icon: typeof Wallet;
}> = [
  { value: "wallet", label: "Wallet", icon: Wallet },
  { value: "transaction", label: "Transaction", icon: ScrollText },
  { value: "token", label: "Token Mint", icon: SearchCode },
  { value: "block", label: "Slot / Block", icon: ScanSearch },
];

export function ExplorerSearchTabs() {
  return (
    <TabsList className="grid w-full grid-cols-2 gap-1 p-1 md:w-auto md:grid-cols-4">
      {SEARCH_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
