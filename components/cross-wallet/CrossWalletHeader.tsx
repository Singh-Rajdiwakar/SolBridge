"use client";

import { Download, FolderPlus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FilterTabs } from "@/components/shared";
import type { TrackedWalletGroupRecord } from "@/types";
import { WalletGroupSelector } from "@/components/cross-wallet/WalletGroupSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const timeframeItems = [
  { label: "24H", value: "24H" },
  { label: "7D", value: "7D" },
  { label: "30D", value: "30D" },
];

export function CrossWalletHeader({
  groups,
  selectedGroupId,
  timeframe,
  onSelectGroup,
  onTimeframeChange,
  onOpenAddWallet,
  onOpenCreateGroup,
  onExport,
  exportFormat,
  onExportFormatChange,
  exportLoading,
}: {
  groups: TrackedWalletGroupRecord[];
  selectedGroupId?: string;
  timeframe: string;
  onSelectGroup: (groupId: string) => void;
  onTimeframeChange: (value: string) => void;
  onOpenAddWallet: () => void;
  onOpenCreateGroup: () => void;
  onExport: () => void;
  exportFormat: "csv" | "json";
  onExportFormatChange: (value: "csv" | "json") => void;
  exportLoading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Cross-Wallet Control</div>
          <div className="mt-2 text-xl font-semibold text-white">Aggregate multiple Solana wallets into one intelligence set.</div>
          <div className="mt-2 text-sm text-slate-400">
            Compare portfolio value, PnL, risk, diversity, whale movement, and protocol exposure without duplicating the single-wallet analytics stack.
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <WalletGroupSelector groups={groups} value={selectedGroupId} onChange={onSelectGroup} />
          <Button variant="secondary" onClick={onOpenCreateGroup}>
            <FolderPlus className="h-4 w-4" />
            New Group
          </Button>
          <Button variant="secondary" onClick={onOpenAddWallet}>
            <Plus className="h-4 w-4" />
            Add Wallet
          </Button>
          <Select value={exportFormat} onValueChange={(value: "csv" | "json") => onExportFormatChange(value)}>
            <SelectTrigger className="w-[7rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onExport} disabled={exportLoading}>
            <Download className="h-4 w-4" />
            {exportLoading ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-4">
        <FilterTabs items={timeframeItems} active={timeframe} onChange={onTimeframeChange} />
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
          Reuses linked wallets, portfolio snapshots, transaction mirrors, and protocol analytics cache
        </div>
      </div>
    </div>
  );
}
