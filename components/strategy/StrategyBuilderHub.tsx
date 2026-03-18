"use client";

import { toast } from "sonner";

import { AllocationBreakdownChart } from "@/components/strategy/AllocationBreakdownChart";
import { AllocationSliderGroup } from "@/components/strategy/AllocationSliderGroup";
import { ExpectedYieldCard } from "@/components/strategy/ExpectedYieldCard";
import { RewardEstimateCard } from "@/components/strategy/RewardEstimateCard";
import { RiskScoreCard } from "@/components/strategy/RiskScoreCard";
import { SaveStrategyModal } from "@/components/strategy/SaveStrategyModal";
import { StrategyBuilderHeader } from "@/components/strategy/StrategyBuilderHeader";
import { StrategyComparisonPanel } from "@/components/strategy/StrategyComparisonPanel";
import { StrategyGrowthChart } from "@/components/strategy/StrategyGrowthChart";
import { StrategyPresetSelector } from "@/components/strategy/StrategyPresetSelector";
import { StressTestPanel } from "@/components/strategy/StressTestPanel";
import { VolatilityImpactCard } from "@/components/strategy/VolatilityImpactCard";
import { EmptyState } from "@/components/shared";
import { useStrategyBuilder } from "@/hooks/useStrategyBuilder";

export function StrategyBuilderHub() {
  const {
    authUser,
    draft,
    setDraft,
    allocationTotal,
    presetKey,
    applyPreset,
    updateAllocation,
    updateAssumption,
    resetStrategy,
    strategiesQuery,
    savedStrategies,
    selectedStrategyIds,
    toggleCompareStrategy,
    loadSavedStrategy,
    simulationQuery,
    currentSimulation,
    comparisonQuery,
    saveModalOpen,
    setSaveModalOpen,
    saveMutation,
    deleteMutation,
    refresh,
    exportCurrentStrategy,
  } = useStrategyBuilder();

  if (!authUser) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8">
        <EmptyState
          title="Sign in to use the strategy builder"
          description="This module uses the existing backend simulation engine and saved strategy store, so an authenticated session is required."
        />
      </div>
    );
  }

  const handleDelete = (strategyId: string) => {
    if (!window.confirm("Delete this saved strategy?")) {
      return;
    }
    deleteMutation.mutate(strategyId);
  };

  return (
    <div className="space-y-6">
      <StrategyBuilderHeader
        timeframe={draft.timeframe}
        onTimeframeChange={(value) => setDraft((current) => ({ ...current, strategyId: undefined, timeframe: value }))}
        scenario={draft.scenario}
        onScenarioChange={(value) => setDraft((current) => ({ ...current, strategyId: undefined, scenario: value }))}
        allocationTotal={allocationTotal}
        portfolioCapital={draft.portfolioCapital}
        onRefresh={() => {
          void refresh().then(() => toast.success("Strategy data refreshed"));
        }}
        onReset={resetStrategy}
        onSave={() => setSaveModalOpen(true)}
        onExport={exportCurrentStrategy}
        loading={simulationQuery.isFetching || comparisonQuery.isFetching}
      />

      <StrategyPresetSelector selectedKey={presetKey} onSelect={applyPreset} />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <AllocationSliderGroup
          draft={draft}
          allocationTotal={allocationTotal}
          onAllocationChange={updateAllocation}
          onCapitalChange={(value) => setDraft((current) => ({ ...current, strategyId: undefined, portfolioCapital: value }))}
          onAssumptionChange={updateAssumption}
          onReset={resetStrategy}
        />

        <div className="grid gap-6">
          <ExpectedYieldCard data={currentSimulation} loading={simulationQuery.isLoading || simulationQuery.isFetching} />
          <div className="grid gap-6 md:grid-cols-2">
            <RiskScoreCard data={currentSimulation} loading={simulationQuery.isLoading || simulationQuery.isFetching} />
            <VolatilityImpactCard data={currentSimulation} loading={simulationQuery.isLoading || simulationQuery.isFetching} />
          </div>
          <RewardEstimateCard data={currentSimulation} loading={simulationQuery.isLoading || simulationQuery.isFetching} />
        </div>
      </div>

      {simulationQuery.error ? (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.08] p-6 text-sm text-rose-200">
          {simulationQuery.error instanceof Error ? simulationQuery.error.message : "Strategy simulation failed."}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <StrategyGrowthChart data={currentSimulation} loading={simulationQuery.isLoading || simulationQuery.isFetching} />
        <AllocationBreakdownChart data={currentSimulation} loading={simulationQuery.isLoading || simulationQuery.isFetching} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <StressTestPanel data={currentSimulation} loading={simulationQuery.isLoading || simulationQuery.isFetching} />
        <StrategyComparisonPanel
          strategies={savedStrategies}
          selectedIds={selectedStrategyIds}
          onToggle={toggleCompareStrategy}
          onLoad={loadSavedStrategy}
          onDelete={handleDelete}
          comparison={comparisonQuery.data}
          comparisonLoading={comparisonQuery.isLoading || comparisonQuery.isFetching || strategiesQuery.isLoading}
        />
      </div>

      <SaveStrategyModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        defaultName={draft.name}
        defaultNotes={draft.notes || ""}
        saving={saveMutation.isPending}
        onSave={(payload) => saveMutation.mutate(payload)}
      />
    </div>
  );
}
