"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { useRiskEngine } from "@/hooks/useRiskEngine";
import { BorrowExposureCard } from "@/components/risk/BorrowExposureCard";
import { ConcentrationRiskCard } from "@/components/risk/ConcentrationRiskCard";
import { LiquidityExposureCard } from "@/components/risk/LiquidityExposureCard";
import { PortfolioRiskScoreCard } from "@/components/risk/PortfolioRiskScoreCard";
import { ProtocolExposureChart } from "@/components/risk/ProtocolExposureChart";
import { RiskBreakdownCards } from "@/components/risk/RiskBreakdownCards";
import { RiskEngineHeader } from "@/components/risk/RiskEngineHeader";
import { RiskEventTimeline } from "@/components/risk/RiskEventTimeline";
import { RiskRecommendationsPanel } from "@/components/risk/RiskRecommendationsPanel";
import { RiskTrendChart } from "@/components/risk/RiskTrendChart";
import { StressScenarioPanel } from "@/components/risk/StressScenarioPanel";
import { VolatilityRiskCard } from "@/components/risk/VolatilityRiskCard";

export function PortfolioRiskHub({ walletAddress }: { walletAddress?: string }) {
  const {
    walletAddress: effectiveWalletAddress,
    range,
    setRange,
    scenario,
    setScenario,
    summaryQuery,
    breakdownQuery,
    trendQuery,
    eventsQuery,
    recommendationsQuery,
    stressTestMutation,
    isLoading,
    refresh,
  } = useRiskEngine(walletAddress);

  const exportPayload = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      walletAddress: effectiveWalletAddress,
      summary: summaryQuery.data,
      breakdown: breakdownQuery.data,
      trend: trendQuery.data,
      recommendations: recommendationsQuery.data,
      events: eventsQuery.data,
      lastScenario: stressTestMutation.data,
    }),
    [
      breakdownQuery.data,
      effectiveWalletAddress,
      eventsQuery.data,
      recommendationsQuery.data,
      stressTestMutation.data,
      summaryQuery.data,
      trendQuery.data,
    ],
  );

  const handleExport = () => {
    if (!effectiveWalletAddress || !summaryQuery.data) {
      toast.error("No risk report available to export yet.");
      return;
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `risk-report-${effectiveWalletAddress.slice(0, 8)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Risk report exported");
  };

  const handleStressRun = () => {
    if (!effectiveWalletAddress) {
      toast.error("Connect a wallet first to simulate portfolio stress.");
      return;
    }

    stressTestMutation.mutate(undefined, {
      onSuccess: () => toast.success("Stress scenario simulated"),
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Stress test failed");
      },
    });
  };

  return (
    <div className="space-y-6">
      <RiskEngineHeader
        range={range}
        scenario={scenario}
        onRangeChange={setRange}
        onScenarioChange={setScenario}
        onRefresh={() => {
          void refresh();
        }}
        onExport={handleExport}
        loading={isLoading}
      />

      {!effectiveWalletAddress ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-slate-400">
          Connect a wallet to activate the portfolio risk engine and generate live protocol-aware scoring.
        </div>
      ) : (
        <>
          <PortfolioRiskScoreCard data={summaryQuery.data} loading={summaryQuery.isLoading} />
          <RiskBreakdownCards data={breakdownQuery.data} loading={breakdownQuery.isLoading} />

          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <RiskTrendChart data={trendQuery.data} />
            <ProtocolExposureChart data={summaryQuery.data?.protocolExposure} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <VolatilityRiskCard data={breakdownQuery.data} />
            <BorrowExposureCard data={breakdownQuery.data} />
            <LiquidityExposureCard data={breakdownQuery.data} />
            <ConcentrationRiskCard data={breakdownQuery.data} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
            <StressScenarioPanel
              data={stressTestMutation.data}
              pending={stressTestMutation.isPending}
              onRun={handleStressRun}
            />
            <RiskRecommendationsPanel data={recommendationsQuery.data} />
          </div>

          <RiskEventTimeline data={eventsQuery.data} />
        </>
      )}
    </div>
  );
}
