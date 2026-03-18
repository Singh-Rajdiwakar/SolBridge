"use client";

import { SectionCard } from "@/components/dashboard/section-card";
import { CapitalGainsTable } from "@/components/tax/CapitalGainsTable";
import { LendingIncomeTable } from "@/components/tax/LendingIncomeTable";
import { MonthlyTaxTrendChart } from "@/components/tax/MonthlyTaxTrendChart";
import { StakingIncomeTable } from "@/components/tax/StakingIncomeTable";
import { TaxDisclaimerCard } from "@/components/tax/TaxDisclaimerCard";
import { TaxEventTimeline } from "@/components/tax/TaxEventTimeline";
import { TaxReportHeader } from "@/components/tax/TaxReportHeader";
import { TaxSummaryCards } from "@/components/tax/TaxSummaryCards";
import { YearlySummaryTable } from "@/components/tax/YearlySummaryTable";
import { useTaxReports } from "@/hooks/useTaxReports";
import { formatCurrency } from "@/utils/format";

export function TaxReportsHub() {
  const {
    scopeType,
    setScopeType,
    year,
    setYear,
    dateRange,
    setDateRange,
    includeProtocols,
    setIncludeProtocols,
    excludeProtocols,
    setExcludeProtocols,
    includeTokensInput,
    setIncludeTokensInput,
    excludeTokensInput,
    setExcludeTokensInput,
    walletOptions,
    selectedWallet,
    setSelectedWallet,
    groupsQuery,
    selectedGroupId,
    setSelectedGroupId,
    reportQuery,
    exportMutation,
    refresh,
  } = useTaxReports();

  const groupOptions = (groupsQuery.data || []).map((group) => ({
    value: group._id,
    label: `${group.name} • ${group.wallets.length} wallets`,
  }));

  const toggleIncludeProtocol = (value: string) => {
    setIncludeProtocols(
      includeProtocols.includes(value)
        ? includeProtocols.filter((item) => item !== value)
        : [...includeProtocols, value],
    );
    setExcludeProtocols(excludeProtocols.filter((item) => item !== value));
  };

  const toggleExcludeProtocol = (value: string) => {
    setExcludeProtocols(
      excludeProtocols.includes(value)
        ? excludeProtocols.filter((item) => item !== value)
        : [...excludeProtocols, value],
    );
    setIncludeProtocols(includeProtocols.filter((item) => item !== value));
  };

  return (
    <div className="space-y-6">
      <TaxReportHeader
        scopeType={scopeType}
        onScopeTypeChange={setScopeType}
        year={year}
        onYearChange={setYear}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        walletOptions={walletOptions}
        selectedWallet={selectedWallet}
        onSelectedWalletChange={setSelectedWallet}
        groupOptions={groupOptions}
        selectedGroupId={selectedGroupId}
        onSelectedGroupChange={setSelectedGroupId}
        includeProtocols={includeProtocols}
        excludeProtocols={excludeProtocols}
        onToggleIncludeProtocol={toggleIncludeProtocol}
        onToggleExcludeProtocol={toggleExcludeProtocol}
        includeTokensInput={includeTokensInput}
        onIncludeTokensInputChange={setIncludeTokensInput}
        excludeTokensInput={excludeTokensInput}
        onExcludeTokensInputChange={setExcludeTokensInput}
        onRefresh={() => {
          void refresh();
        }}
        onExport={(format) => exportMutation.mutate(format)}
        exporting={exportMutation.isPending}
      />

      {!selectedWallet && scopeType === "wallet" ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-slate-400">
          Select a linked wallet to generate a tax report.
        </div>
      ) : null}

      {!selectedGroupId && scopeType === "group" ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-slate-400">
          Select a tracked wallet group to generate a combined multi-wallet tax report.
        </div>
      ) : null}

      {reportQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 rounded-xl border border-white/8 bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : null}

      {reportQuery.error ? (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/8 p-6 text-sm text-rose-200">
          {reportQuery.error instanceof Error ? reportQuery.error.message : "Tax report generation failed."}
        </div>
      ) : null}

      {reportQuery.data ? (
        <>
          <TaxSummaryCards summary={reportQuery.data.summary} />

          <SectionCard
            title="Report Highlights"
            description="Key annual tax observations computed from transaction history, staking rewards, lending events, and cached price context."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Selected Scope</div>
                <div className="mt-3 text-lg font-semibold text-white">{reportQuery.data.scope.name}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Largest Gain</div>
                <div className="mt-3 text-lg font-semibold text-emerald-300">
                  {reportQuery.data.summary.largestGainThisYear
                    ? `${reportQuery.data.summary.largestGainThisYear.token} • ${formatCurrency(reportQuery.data.summary.largestGainThisYear.value)}`
                    : "No realized gains"}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Largest Income Source</div>
                <div className="mt-3 text-lg font-semibold text-cyan-200">
                  {reportQuery.data.summary.largestIncomeSource
                    ? `${reportQuery.data.summary.largestIncomeSource.token} • ${formatCurrency(reportQuery.data.summary.largestIncomeSource.value)}`
                    : "No protocol income"}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Generated On</div>
                <div className="mt-3 text-lg font-semibold text-white">
                  {new Date(reportQuery.data.generatedAt).toLocaleDateString("en-US")}
                </div>
              </div>
            </div>
          </SectionCard>

          <MonthlyTaxTrendChart report={reportQuery.data} />
          <CapitalGainsTable data={reportQuery.data.capitalGains} />

          <div className="grid gap-6 xl:grid-cols-2">
            <StakingIncomeTable data={reportQuery.data.stakingIncome} />
            <LendingIncomeTable data={reportQuery.data.lendingIncome} />
          </div>

          <YearlySummaryTable report={reportQuery.data} />
          <TaxEventTimeline report={reportQuery.data} />
          <TaxDisclaimerCard disclaimer={reportQuery.data.disclaimer} warnings={reportQuery.data.summary.warnings} />
        </>
      ) : null}
    </div>
  );
}
