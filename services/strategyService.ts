"use client";

import { strategyApi } from "@/services/api";
import type {
  StrategyAssumptions,
  StrategyComparisonResponse,
  StrategyPlanRecord,
  StrategySimulationResponse,
  StrategyScenario,
  StrategyTimeframe,
} from "@/types";

export interface StrategyDraftPayload {
  name: string;
  allocations: {
    staking: number;
    liquidity: number;
    lending: number;
    hold: number;
    governance: number;
    stableReserve: number;
  };
  portfolioCapital: number;
  timeframe: StrategyTimeframe;
  scenario: StrategyScenario;
  assumptions?: StrategyAssumptions;
  notes?: string;
}

export async function listStrategyPlans() {
  return strategyApi.list();
}

export async function createStrategyPlan(payload: StrategyDraftPayload) {
  return strategyApi.create(payload);
}

export async function updateStrategyPlan(strategyId: string, payload: Partial<StrategyDraftPayload>) {
  return strategyApi.update(strategyId, payload);
}

export async function deleteStrategyPlan(strategyId: string) {
  return strategyApi.delete(strategyId);
}

export async function simulateStrategyPlan(payload: StrategyDraftPayload) {
  return strategyApi.simulate(payload);
}

export async function compareStrategyPlans(payload: {
  strategyIds?: string[];
  strategies?: Array<StrategyDraftPayload & { strategyId?: string }>;
}) {
  return strategyApi.compare(payload);
}

export type {
  StrategyComparisonResponse,
  StrategyPlanRecord,
  StrategySimulationResponse,
};
