import type {
  StrategyAllocations,
  StrategyAssumptions,
  StrategyScenario,
  StrategyTimeframe,
} from "@/types";

export const DEFAULT_STRATEGY_ALLOCATIONS: StrategyAllocations = {
  staking: 35,
  liquidity: 20,
  lending: 15,
  hold: 20,
  governance: 5,
  stableReserve: 5,
};

export const DEFAULT_STRATEGY_ASSUMPTIONS: StrategyAssumptions = {
  stakingToken: "SOL",
  liquidityPair: "SOL/USDC",
  lendingAsset: "USDC",
  governanceToken: "GOV",
  stableAsset: "USDC",
};

export const STRATEGY_BUCKET_META = [
  {
    key: "staking",
    label: "Staking",
    description: "Locked capital earning validator and protocol rewards.",
    accent: "from-cyan-500/20 to-blue-500/5",
  },
  {
    key: "liquidity",
    label: "Liquidity Pools",
    description: "Pool-based fee generation with impermanent loss sensitivity.",
    accent: "from-violet-500/20 to-blue-500/5",
  },
  {
    key: "lending",
    label: "Lending",
    description: "Supply-side yield with lower volatility than LP-heavy strategies.",
    accent: "from-emerald-500/20 to-blue-500/5",
  },
  {
    key: "hold",
    label: "Hold / Idle",
    description: "Spot balance left unproductive or positioned for appreciation.",
    accent: "from-slate-500/20 to-blue-500/5",
  },
  {
    key: "governance",
    label: "Governance Hold",
    description: "Governance-token exposure for protocol participation upside.",
    accent: "from-fuchsia-500/20 to-blue-500/5",
  },
  {
    key: "stableReserve",
    label: "Stable Reserve",
    description: "Defensive reserve for resilience, runway, and rebalance optionality.",
    accent: "from-amber-500/20 to-blue-500/5",
  },
] as const;

export const STRATEGY_TIMEFRAME_OPTIONS: Array<{
  value: StrategyTimeframe;
  label: string;
}> = [
  { value: "30D", label: "30D" },
  { value: "90D", label: "90D" },
  { value: "180D", label: "180D" },
  { value: "1Y", label: "1Y" },
];

export const STRATEGY_SCENARIO_OPTIONS: Array<{
  value: StrategyScenario;
  label: string;
  helper: string;
}> = [
  { value: "optimistic", label: "Optimistic", helper: "Higher yield, lower stress assumptions" },
  { value: "base", label: "Base", helper: "Neutral protocol and market assumptions" },
  { value: "conservative", label: "Conservative", helper: "Compressed yield and higher volatility" },
];

export const STRATEGY_PRESETS: Array<{
  key: string;
  label: string;
  description: string;
  allocations: StrategyAllocations;
  timeframe: StrategyTimeframe;
  scenario: StrategyScenario;
  assumptions: StrategyAssumptions;
}> = [
  {
    key: "conservative-income",
    label: "Conservative Income",
    description: "Stable reserve heavy mix focused on capital preservation with modest yield.",
    allocations: {
      staking: 25,
      liquidity: 10,
      lending: 15,
      hold: 10,
      governance: 5,
      stableReserve: 35,
    },
    timeframe: "1Y",
    scenario: "conservative",
    assumptions: {
      stakingToken: "SOL",
      liquidityPair: "USDC/USDT",
      lendingAsset: "USDC",
      governanceToken: "GOV",
      stableAsset: "USDC",
    },
  },
  {
    key: "balanced-growth",
    label: "Balanced Growth",
    description: "Balanced across staking, LPs, lending, and spot reserve for steady growth.",
    allocations: DEFAULT_STRATEGY_ALLOCATIONS,
    timeframe: "1Y",
    scenario: "base",
    assumptions: DEFAULT_STRATEGY_ASSUMPTIONS,
  },
  {
    key: "aggressive-yield",
    label: "Aggressive Yield Farming",
    description: "Higher LP and staking tilt for maximum modeled return with elevated volatility.",
    allocations: {
      staking: 30,
      liquidity: 35,
      lending: 15,
      hold: 10,
      governance: 5,
      stableReserve: 5,
    },
    timeframe: "180D",
    scenario: "optimistic",
    assumptions: {
      stakingToken: "SOL",
      liquidityPair: "SOL/USDC",
      lendingAsset: "USDC",
      governanceToken: "GOV",
      stableAsset: "USDC",
    },
  },
  {
    key: "stable-strategy",
    label: "Stable Strategy",
    description: "Strong reserve posture with lending and minimal volatile DeFi exposure.",
    allocations: {
      staking: 10,
      liquidity: 5,
      lending: 30,
      hold: 10,
      governance: 5,
      stableReserve: 40,
    },
    timeframe: "90D",
    scenario: "conservative",
    assumptions: {
      stakingToken: "MSOL",
      liquidityPair: "USDC/USDT",
      lendingAsset: "USDC",
      governanceToken: "GOV",
      stableAsset: "USDC",
    },
  },
  {
    key: "sol-focused",
    label: "SOL-Focused Strategy",
    description: "SOL-dominant thesis with staking and selective yield support around core conviction.",
    allocations: {
      staking: 45,
      liquidity: 15,
      lending: 10,
      hold: 20,
      governance: 5,
      stableReserve: 5,
    },
    timeframe: "1Y",
    scenario: "base",
    assumptions: {
      stakingToken: "SOL",
      liquidityPair: "SOL/USDC",
      lendingAsset: "USDC",
      governanceToken: "RTX",
      stableAsset: "USDC",
    },
  },
];
