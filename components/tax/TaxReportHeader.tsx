"use client";

import { CalendarDays, Filter, RefreshCcw } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { FilterTabs } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportReportButtons } from "@/components/tax/ExportReportButtons";

const PROTOCOLS = ["wallet", "token", "staking", "lending", "liquidity", "governance"];

export function TaxReportHeader(props: {
  scopeType: "wallet" | "group";
  onScopeTypeChange: (value: "wallet" | "group") => void;
  year: number;
  onYearChange: (value: number) => void;
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (next: { startDate: string; endDate: string }) => void;
  walletOptions: Array<{ value: string; label: string }>;
  selectedWallet: string;
  onSelectedWalletChange: (value: string) => void;
  groupOptions: Array<{ value: string; label: string }>;
  selectedGroupId: string;
  onSelectedGroupChange: (value: string) => void;
  includeProtocols: string[];
  excludeProtocols: string[];
  onToggleIncludeProtocol: (value: string) => void;
  onToggleExcludeProtocol: (value: string) => void;
  includeTokensInput: string;
  onIncludeTokensInputChange: (value: string) => void;
  excludeTokensInput: string;
  onExcludeTokensInputChange: (value: string) => void;
  onRefresh: () => void;
  onExport: (format: "json" | "csv" | "pdf") => void;
  exporting?: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Crypto Tax Reports"
        subtitle="Capital gains, staking income, lending income, and yearly taxable activity generated from wallet and protocol records without replacing on-chain truth."
        action={<ExportReportButtons onExport={props.onExport} loading={props.exporting} />}
      />

      <div className="grid gap-4 rounded-xl border border-white/10 bg-[rgba(10,18,35,0.9)] p-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Report Scope</div>
          <FilterTabs
            items={[
              { label: "Wallet", value: "wallet" },
              { label: "Group", value: "group" },
            ]}
            active={props.scopeType}
            onChange={(value) => props.onScopeTypeChange(value as "wallet" | "group")}
          />
        </div>

        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Year</div>
          <Select value={String(props.year)} onValueChange={(value) => props.onYearChange(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {props.scopeType === "group" ? "Wallet Group" : "Wallet"}
          </div>
          {props.scopeType === "group" ? (
            <Select value={props.selectedGroupId} onValueChange={props.onSelectedGroupChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {props.groupOptions.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={props.selectedWallet} onValueChange={props.onSelectedWalletChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {props.walletOptions.map((wallet) => (
                  <SelectItem key={wallet.value} value={wallet.value}>
                    {wallet.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Start Date</div>
          <Input
            type="date"
            value={props.dateRange.startDate}
            onChange={(event) => props.onDateRangeChange({ ...props.dateRange, startDate: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
            <span>End Date</span>
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={props.onRefresh}>
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
          <Input
            type="date"
            value={props.dateRange.endDate}
            onChange={(event) => props.onDateRangeChange({ ...props.dateRange, endDate: event.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-white/10 bg-[rgba(10,18,35,0.85)] p-4 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Include Protocols
          </div>
          <div className="flex flex-wrap gap-2">
            {PROTOCOLS.map((protocol) => (
              <button
                key={`include-${protocol}`}
                type="button"
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  props.includeProtocols.includes(protocol)
                    ? "border-cyan-400/30 bg-cyan-400/12 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-400"
                }`}
                onClick={() => props.onToggleIncludeProtocol(protocol)}
              >
                {protocol}
              </button>
            ))}
          </div>
          <Input
            value={props.includeTokensInput}
            onChange={(event) => props.onIncludeTokensInputChange(event.target.value)}
            placeholder="Include tokens (comma separated, e.g. SOL,USDC,RTX)"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Exclude Filters
          </div>
          <div className="flex flex-wrap gap-2">
            {PROTOCOLS.map((protocol) => (
              <button
                key={`exclude-${protocol}`}
                type="button"
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  props.excludeProtocols.includes(protocol)
                    ? "border-amber-400/30 bg-amber-400/12 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-400"
                }`}
                onClick={() => props.onToggleExcludeProtocol(protocol)}
              >
                {protocol}
              </button>
            ))}
          </div>
          <Input
            value={props.excludeTokensInput}
            onChange={(event) => props.onExcludeTokensInputChange(event.target.value)}
            placeholder="Exclude tokens (comma separated, e.g. BONK,GOV)"
          />
        </div>
      </div>
    </div>
  );
}
