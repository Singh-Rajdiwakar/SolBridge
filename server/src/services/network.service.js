import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { env } from "../config/env.js";
import { NetworkMetricSnapshot } from "../models/NetworkMetricSnapshot.js";
import { NetworkStatusEvent } from "../models/NetworkStatusEvent.js";
import { estimateTransactionFee, getRpcLatency, getSolanaConnection } from "./solana.service.js";

const NETWORK_NAME = "Solana Devnet";
const DEFAULT_RANGE = "24H";
const RANGE_TO_MS = {
  "1H": 60 * 60 * 1000,
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
};
const HEALTH_THRESHOLDS = {
  tpsHealthy: 1200,
  tpsModerate: 400,
  blockTimeHealthy: 0.7,
  blockTimeWatch: 1.05,
  rpcLatencyHealthy: 450,
  rpcLatencyWatch: 950,
  feeHealthy: 0.000015,
  feeWatch: 0.00006,
  validatorHealthy: 1500,
  validatorWatch: 800,
};
const HEALTH_WEIGHTS = {
  tps: 0.26,
  blockTime: 0.22,
  rpcLatency: 0.26,
  fee: 0.12,
  validators: 0.14,
};
const FRESH_SNAPSHOT_MS = 90 * 1000;

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getRangeStart(range = DEFAULT_RANGE) {
  return Date.now() - (RANGE_TO_MS[range] || RANGE_TO_MS[DEFAULT_RANGE]);
}

function formatRangeLabel(date, range = DEFAULT_RANGE) {
  const value = new Date(date);
  if (range === "1H") {
    return value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (range === "24H") {
    return value.toLocaleTimeString("en-US", { hour: "numeric" });
  }
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getHealthLabel(score) {
  if (score >= 82) return "Healthy";
  if (score >= 64) return "Moderate";
  if (score >= 44) return "Degraded";
  return "Unstable";
}

function getHealthStatus(score) {
  if (score >= 82) return "healthy";
  if (score >= 64) return "moderate";
  if (score >= 44) return "degraded";
  return "unstable";
}

function scoreTps(value) {
  if (value >= HEALTH_THRESHOLDS.tpsHealthy) return 100;
  if (value >= HEALTH_THRESHOLDS.tpsModerate) return 74;
  if (value >= 150) return 52;
  if (value >= 60) return 34;
  return 18;
}

function scoreBlockTime(value) {
  if (value <= HEALTH_THRESHOLDS.blockTimeHealthy) return 100;
  if (value <= HEALTH_THRESHOLDS.blockTimeWatch) return 72;
  if (value <= 1.35) return 48;
  if (value <= 1.8) return 28;
  return 14;
}

function scoreRpcLatency(value) {
  if (value <= HEALTH_THRESHOLDS.rpcLatencyHealthy) return 100;
  if (value <= HEALTH_THRESHOLDS.rpcLatencyWatch) return 70;
  if (value <= 1500) return 42;
  if (value <= 2200) return 24;
  return 12;
}

function scoreFee(value) {
  if (value <= HEALTH_THRESHOLDS.feeHealthy) return 100;
  if (value <= HEALTH_THRESHOLDS.feeWatch) return 74;
  if (value <= 0.00012) return 52;
  if (value <= 0.0002) return 34;
  return 18;
}

function scoreValidators(value) {
  if (value >= HEALTH_THRESHOLDS.validatorHealthy) return 100;
  if (value >= HEALTH_THRESHOLDS.validatorWatch) return 76;
  if (value >= 400) return 54;
  if (value >= 200) return 32;
  return 18;
}

function derivePrimaryIssue(breakdown) {
  return breakdown.slice().sort((a, b) => a.score - b.score)[0];
}

function buildThresholdWarnings(current) {
  const warnings = [];

  if (current.rpcLatency >= HEALTH_THRESHOLDS.rpcLatencyWatch) {
    warnings.push("RPC latency is elevated and may slow wallet actions.");
  }
  if (current.blockTime >= HEALTH_THRESHOLDS.blockTimeWatch) {
    warnings.push("Recent block time variance suggests slower confirmation cadence.");
  }
  if (current.tps <= HEALTH_THRESHOLDS.tpsModerate) {
    warnings.push("Network TPS is under the preferred throughput comfort band.");
  }
  if (current.avgFee >= HEALTH_THRESHOLDS.feeWatch) {
    warnings.push("Average network fees are above the normal operating band.");
  }
  if (current.validatorCount <= HEALTH_THRESHOLDS.validatorWatch) {
    warnings.push("Validator count is below the healthy reference level.");
  }

  return warnings;
}

function buildProtocolImpact(current, health, warnings) {
  const items = [];

  if (current.rpcLatency > HEALTH_THRESHOLDS.rpcLatencyWatch) {
    items.push("Current RPC latency may slow wallet signatures, explorer queries, and admin actions.");
  } else {
    items.push("RPC responsiveness is healthy, so wallet operations should feel responsive.");
  }

  if (current.avgFee <= HEALTH_THRESHOLDS.feeHealthy) {
    items.push("Low fees make staking, liquidity, lending, and transfer interactions cheap to execute.");
  } else {
    items.push("Higher fee pressure can increase the visible cost of protocol interactions.");
  }

  if (current.tps >= HEALTH_THRESHOLDS.tpsModerate && current.blockTime <= HEALTH_THRESHOLDS.blockTimeWatch) {
    items.push("Network throughput is strong enough for transaction-heavy protocol flows.");
  } else {
    items.push("Recent network conditions may reduce smoothness for bursty transaction flows.");
  }

  if (warnings.length === 0) {
    items.push("Network is ready for transaction-heavy activity across wallet, trading, and protocol modules.");
  }

  return {
    summary:
      health.score >= 82
        ? "Network is healthy and suitable for protocol interaction."
        : `${health.primaryIssue.label} is the main factor affecting user experience right now.`,
    items: items.slice(0, 4),
  };
}

function metricStatus(label, value) {
  switch (label) {
    case "Network TPS":
      return value >= HEALTH_THRESHOLDS.tpsModerate ? "normal" : "low";
    case "Avg Block Time":
      return value <= HEALTH_THRESHOLDS.blockTimeWatch ? "healthy" : "unstable";
    case "Avg Fee":
      return value <= HEALTH_THRESHOLDS.feeWatch ? "normal" : "elevated";
    case "Validators Online":
      return value >= HEALTH_THRESHOLDS.validatorWatch ? "healthy" : "low";
    case "RPC Latency":
      return value <= HEALTH_THRESHOLDS.rpcLatencyWatch ? "healthy" : "degraded";
    default:
      return "normal";
  }
}

async function getFeeMetrics(connection) {
  const [baseFee, priorityFees] = await Promise.all([
    estimateTransactionFee().catch(() => 0.000005),
    connection.getRecentPrioritizationFees().catch(() => []),
  ]);

  const recentPrioritySol = average(
    priorityFees
      .slice(0, 12)
      .map((item) => Number(item.prioritizationFee || 0) / LAMPORTS_PER_SOL)
      .filter((value) => Number.isFinite(value)),
  );

  const avgFee = round(baseFee + recentPrioritySol, 6);

  return {
    avgFee,
    low: round(Math.max(avgFee * 0.82, 0.000001), 6),
    high: round(Math.max(avgFee * 1.28, avgFee), 6),
  };
}

async function getPerformanceMetrics(connection) {
  const samples = await connection.getRecentPerformanceSamples(20).catch(() => []);
  const tpsSeries = samples
    .map((sample) => {
      if (!sample?.samplePeriodSecs) {
        return 0;
      }
      return sample.numTransactions / sample.samplePeriodSecs;
    })
    .filter((value) => Number.isFinite(value));
  const blockTimeSeries = samples
    .map((sample) => {
      if (!sample?.numSlots) {
        return 0;
      }
      return sample.samplePeriodSecs / sample.numSlots;
    })
    .filter((value) => Number.isFinite(value) && value > 0);
  const throughputSeries = samples
    .map((sample) => {
      if (!sample?.samplePeriodSecs) {
        return 0;
      }
      return (sample.numTransactions / sample.samplePeriodSecs) * 60;
    })
    .filter((value) => Number.isFinite(value));

  return {
    currentTps: round(tpsSeries[0] || 0, 2),
    recentAverageTps: round(average(tpsSeries.slice(0, 5)), 2),
    peakTps: round(Math.max(...tpsSeries, 0), 2),
    blockTime: round(blockTimeSeries[0] || 0, 3),
    averageBlockTime: round(average(blockTimeSeries.slice(0, 5)), 3),
    throughput: round(throughputSeries[0] || 0, 2),
    averageThroughput: round(average(throughputSeries.slice(0, 5)), 2),
    tpsSeries: tpsSeries.slice(0, 12).reverse().map((value) => round(value, 2)),
    blockTimeSeries: blockTimeSeries.slice(0, 12).reverse().map((value) => round(value, 3)),
    throughputSeries: throughputSeries.slice(0, 12).reverse().map((value) => round(value, 2)),
  };
}

function computeHealth(current) {
  const breakdown = [
    { key: "tps", label: "TPS Stability", score: scoreTps(current.recentAverageTps || current.tps) },
    { key: "blockTime", label: "Block Time Stability", score: scoreBlockTime(current.avgBlockTime || current.blockTime) },
    { key: "rpcLatency", label: "RPC Latency", score: scoreRpcLatency(current.rpcLatency) },
    { key: "fee", label: "Fee Stability", score: scoreFee(current.avgFee) },
    { key: "validators", label: "Validator Count", score: scoreValidators(current.validatorCount) },
  ];

  const weightedScore = round(
    breakdown.reduce((sum, item) => sum + item.score * HEALTH_WEIGHTS[item.key], 0),
    2,
  );
  const primaryIssue = derivePrimaryIssue(breakdown);

  return {
    score: weightedScore,
    label: getHealthLabel(weightedScore),
    status: getHealthStatus(weightedScore),
    primaryIssue,
    breakdown,
  };
}

async function measureRpcEndpoint(url) {
  const startedAt = Date.now();
  const connection = new Connection(url, "confirmed");
  const [version, blockHeight] = await Promise.all([
    connection.getVersion().catch(() => ({})),
    connection.getBlockHeight("confirmed").catch(() => 0),
  ]);

  return {
    endpointLabel: url.includes("devnet") ? "Solana Devnet RPC" : "Custom RPC",
    endpointUrl: url,
    latency: Date.now() - startedAt,
    version: version["solana-core"] || "--",
    blockHeight,
  };
}

async function getEndpointComparison() {
  const candidates = Array.from(
    new Set([env.solanaRpcUrl, "https://api.devnet.solana.com"].filter(Boolean)),
  ).slice(0, 3);

  const results = await Promise.all(
    candidates.map(async (url) => {
      try {
        const endpoint = await measureRpcEndpoint(url);
        return {
          ...endpoint,
          status:
            endpoint.latency <= HEALTH_THRESHOLDS.rpcLatencyHealthy
              ? "healthy"
              : endpoint.latency <= HEALTH_THRESHOLDS.rpcLatencyWatch
                ? "moderate"
                : "degraded",
          recommended: url === env.solanaRpcUrl,
        };
      } catch {
        return {
          endpointLabel: url.includes("devnet") ? "Solana Devnet RPC" : "Custom RPC",
          endpointUrl: url,
          latency: 0,
          version: "--",
          blockHeight: 0,
          status: "degraded",
          recommended: url === env.solanaRpcUrl,
        };
      }
    }),
  );

  return results.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return (a.latency || Number.MAX_SAFE_INTEGER) - (b.latency || Number.MAX_SAFE_INTEGER);
  });
}

async function fetchLiveNetworkMetrics() {
  const connection = getSolanaConnection();
  const [rpcLatency, feeMetrics, performance, voteAccounts, version, slot, blockHeight] = await Promise.all([
    getRpcLatency().catch(() => 0),
    getFeeMetrics(connection),
    getPerformanceMetrics(connection),
    connection.getVoteAccounts().catch(() => ({ current: [], delinquent: [] })),
    connection.getVersion().catch(() => ({})),
    connection.getSlot("confirmed").catch(() => 0),
    connection.getBlockHeight("confirmed").catch(() => 0),
  ]);

  const activeValidators = voteAccounts.current?.length || 0;
  const delinquentValidators = voteAccounts.delinquent?.length || 0;
  const validatorCount = activeValidators + delinquentValidators;

  const current = {
    tps: performance.currentTps,
    recentAverageTps: performance.recentAverageTps,
    peakTps: performance.peakTps,
    blockTime: performance.blockTime,
    avgBlockTime: performance.averageBlockTime,
    throughput: performance.throughput,
    averageThroughput: performance.averageThroughput,
    avgFee: feeMetrics.avgFee,
    feeLow: feeMetrics.low,
    feeHigh: feeMetrics.high,
    validatorCount,
    activeValidators,
    delinquentValidators,
    rpcLatency,
    slot,
    blockHeight,
    version: version["solana-core"] || "--",
  };
  const health = computeHealth(current);
  const warnings = buildThresholdWarnings(current);
  const endpointComparison = await getEndpointComparison();

  return {
    network: NETWORK_NAME,
    endpointLabel: endpointComparison[0]?.endpointLabel || "Solana Devnet RPC",
    endpointUrl: env.solanaRpcUrl,
    recordedAt: new Date().toISOString(),
    current,
    liveSeries: {
      tps: performance.tpsSeries,
      blockTime: performance.blockTimeSeries,
      throughput: performance.throughputSeries,
    },
    health,
    warnings,
    endpointComparison,
  };
}

function createEventPayload(previousSnapshot, currentSnapshot) {
  if (!previousSnapshot) {
    return {
      type: "network-monitor-online",
      severity: "info",
      title: "Network monitor initialized",
      description: "Baseline network metrics were recorded for the configured Solana RPC endpoint.",
      metricKey: "healthScore",
      metricValue: currentSnapshot.healthScore,
    };
  }

  const deltas = {
    rpcLatency: currentSnapshot.rpcLatency - previousSnapshot.rpcLatency,
    tps: currentSnapshot.tps - previousSnapshot.tps,
    blockTime: currentSnapshot.blockTime - previousSnapshot.blockTime,
    avgFee: currentSnapshot.avgFee - previousSnapshot.avgFee,
    healthScore: currentSnapshot.healthScore - previousSnapshot.healthScore,
  };

  if (
    currentSnapshot.rpcLatency >= HEALTH_THRESHOLDS.rpcLatencyWatch &&
    previousSnapshot.rpcLatency < HEALTH_THRESHOLDS.rpcLatencyWatch
  ) {
    return {
      type: "rpc-latency-spike",
      severity: "warning",
      title: "RPC latency increased",
      description: "RPC responsiveness moved into the degraded band and may affect transaction UX.",
      metricKey: "rpcLatency",
      metricValue: currentSnapshot.rpcLatency,
    };
  }

  if (
    currentSnapshot.blockTime >= HEALTH_THRESHOLDS.blockTimeWatch &&
    previousSnapshot.blockTime < HEALTH_THRESHOLDS.blockTimeWatch
  ) {
    return {
      type: "block-time-variance",
      severity: "warning",
      title: "Block time instability detected",
      description: "Recent block times are slower than the preferred confirmation band.",
      metricKey: "blockTime",
      metricValue: currentSnapshot.blockTime,
    };
  }

  if (previousSnapshot.tps > 0 && currentSnapshot.tps <= previousSnapshot.tps * 0.65) {
    return {
      type: "tps-drop",
      severity: "warning",
      title: "TPS dropped sharply",
      description: "Recent throughput dropped materially versus the previous snapshot window.",
      metricKey: "tps",
      metricValue: currentSnapshot.tps,
    };
  }

  if (deltas.healthScore >= 8) {
    return {
      type: "network-recovery",
      severity: "info",
      title: "Network health improved",
      description: "Recent network metrics recovered and the health score improved.",
      metricKey: "healthScore",
      metricValue: currentSnapshot.healthScore,
    };
  }

  if (currentSnapshot.avgFee >= HEALTH_THRESHOLDS.feeWatch && previousSnapshot.avgFee < HEALTH_THRESHOLDS.feeWatch) {
    return {
      type: "fee-spike",
      severity: "warning",
      title: "Fee pressure increased",
      description: "Average network fees rose above the preferred operating band.",
      metricKey: "avgFee",
      metricValue: currentSnapshot.avgFee,
    };
  }

  return null;
}

function toHistoryPoint(snapshot, range) {
  return {
    label: formatRangeLabel(snapshot.recordedAt, range),
    recordedAt: snapshot.recordedAt,
    tps: round(snapshot.tps, 2),
    recentAverageTps: round(snapshot.recentAverageTps, 2),
    peakTps: round(snapshot.peakTps, 2),
    blockTime: round(snapshot.blockTime, 3),
    throughput: round(snapshot.throughput, 2),
    avgFee: round(snapshot.avgFee, 6),
    validatorCount: round(snapshot.validatorCount, 0),
    rpcLatency: round(snapshot.rpcLatency, 0),
    healthScore: round(snapshot.healthScore, 2),
  };
}

async function ensureFreshSnapshot() {
  const latest = await NetworkMetricSnapshot.findOne({ network: NETWORK_NAME }).sort({ recordedAt: -1 });
  const now = Date.now();

  if (latest && now - new Date(latest.recordedAt).getTime() < FRESH_SNAPSHOT_MS) {
    return latest.toObject();
  }

  const live = await fetchLiveNetworkMetrics();
  const snapshotPayload = {
    network: NETWORK_NAME,
    endpointLabel: live.endpointLabel,
    endpointUrl: live.endpointUrl,
    tps: live.current.tps,
    recentAverageTps: live.current.recentAverageTps,
    peakTps: live.current.peakTps,
    blockTime: live.current.blockTime,
    throughput: live.current.throughput,
    avgFee: live.current.avgFee,
    validatorCount: live.current.validatorCount,
    activeValidators: live.current.activeValidators,
    delinquentValidators: live.current.delinquentValidators,
    rpcLatency: live.current.rpcLatency,
    healthScore: live.health.score,
    slot: live.current.slot,
    blockHeight: live.current.blockHeight,
    version: live.current.version,
    recordedAt: new Date(live.recordedAt),
  };

  const created = await NetworkMetricSnapshot.create(snapshotPayload);
  const event = createEventPayload(latest?.toObject?.() || latest, created.toObject());

  if (event) {
    await NetworkStatusEvent.create({
      network: NETWORK_NAME,
      ...event,
      createdAt: created.recordedAt,
    });
  }

  return created.toObject();
}

async function getHistory(range = DEFAULT_RANGE) {
  await ensureFreshSnapshot();

  const snapshots = await NetworkMetricSnapshot.find({
    network: NETWORK_NAME,
    recordedAt: { $gte: new Date(getRangeStart(range)) },
  })
    .sort({ recordedAt: -1 })
    .limit(range === "30D" ? 160 : range === "7D" ? 120 : 80)
    .lean();

  return snapshots.reverse();
}

function buildOverviewCards(history, lastUpdated) {
  const latest = history[history.length - 1] || null;
  const previous = history[history.length - 2] || null;
  const getTrend = (key, fallbackCurrent, fallbackAverage) => {
    if (latest && previous) {
      return round((latest[key] || 0) - (previous[key] || 0), key === "avgFee" ? 6 : 2);
    }
    return round((fallbackCurrent || 0) - (fallbackAverage || 0), key === "avgFee" ? 6 : 2);
  };

  return [
    {
      key: "tps",
      label: "Network TPS",
      value: latest?.tps || 0,
      unit: "TPS",
      trend: getTrend("tps"),
      lastUpdated,
      status: metricStatus("Network TPS", latest?.tps || 0),
      sparkline: history.slice(-12).map((item) => round(item.tps, 2)),
    },
    {
      key: "blockTime",
      label: "Avg Block Time",
      value: latest?.blockTime || 0,
      unit: "s",
      trend: getTrend("blockTime"),
      lastUpdated,
      status: metricStatus("Avg Block Time", latest?.blockTime || 0),
      sparkline: history.slice(-12).map((item) => round(item.blockTime, 3)),
    },
    {
      key: "throughput",
      label: "Throughput",
      value: latest?.throughput || 0,
      unit: "tx/min",
      trend: getTrend("throughput"),
      lastUpdated,
      status: "normal",
      sparkline: history.slice(-12).map((item) => round(item.throughput, 2)),
    },
    {
      key: "avgFee",
      label: "Avg Fee",
      value: latest?.avgFee || 0,
      unit: "SOL",
      trend: getTrend("avgFee"),
      lastUpdated,
      status: metricStatus("Avg Fee", latest?.avgFee || 0),
      sparkline: history.slice(-12).map((item) => round(item.avgFee, 6)),
    },
    {
      key: "validatorCount",
      label: "Validators Online",
      value: latest?.validatorCount || 0,
      unit: "",
      trend: getTrend("validatorCount"),
      lastUpdated,
      status: metricStatus("Validators Online", latest?.validatorCount || 0),
      sparkline: history.slice(-12).map((item) => round(item.validatorCount, 0)),
    },
    {
      key: "rpcLatency",
      label: "RPC Latency",
      value: latest?.rpcLatency || 0,
      unit: "ms",
      trend: getTrend("rpcLatency"),
      lastUpdated,
      status: metricStatus("RPC Latency", latest?.rpcLatency || 0),
      sparkline: history.slice(-12).map((item) => round(item.rpcLatency, 0)),
    },
  ];
}

function buildMetricResponse(range, key, label, unit, history, extra = {}) {
  const points = history.map((snapshot) => ({
    label: formatRangeLabel(snapshot.recordedAt, range),
    recordedAt: snapshot.recordedAt,
    value: round(snapshot[key], key === "avgFee" ? 6 : key === "blockTime" ? 3 : 2),
  }));
  const values = points.map((point) => point.value);
  const current = values[values.length - 1] || 0;
  const averageValue = average(values);

  return {
    range,
    label,
    unit,
    current: round(current, key === "avgFee" ? 6 : key === "blockTime" ? 3 : 2),
    average: round(averageValue, key === "avgFee" ? 6 : key === "blockTime" ? 3 : 2),
    peak: round(Math.max(...values, 0), key === "avgFee" ? 6 : key === "blockTime" ? 3 : 2),
    low: round(values.length ? Math.min(...values) : 0, key === "avgFee" ? 6 : key === "blockTime" ? 3 : 2),
    lastUpdated: history[history.length - 1]?.recordedAt || null,
    points,
    ...extra,
  };
}

export async function recordNetworkSnapshot() {
  return ensureFreshSnapshot();
}

export async function getNetworkOverview(range = DEFAULT_RANGE) {
  const [history, live] = await Promise.all([getHistory(range), fetchLiveNetworkMetrics()]);
  const currentSnapshot = history[history.length - 1];
  const health = computeHealth({
    ...live.current,
    avgFee: currentSnapshot?.avgFee || live.current.avgFee,
    rpcLatency: currentSnapshot?.rpcLatency || live.current.rpcLatency,
    validatorCount: currentSnapshot?.validatorCount || live.current.validatorCount,
  });
  const thresholdWarnings = buildThresholdWarnings(live.current);
  const protocolImpact = buildProtocolImpact(live.current, health, thresholdWarnings);

  return {
    network: NETWORK_NAME,
    endpointLabel: live.endpointLabel,
    endpointUrl: env.solanaRpcUrl,
    environment: "devnet",
    range,
    autoRefreshSuggestedMs: 30000,
    lastUpdated: currentSnapshot?.recordedAt || live.recordedAt,
    current: live.current,
    health: {
      score: health.score,
      label: health.label,
      status: health.status,
      primaryIssue: health.primaryIssue,
      breakdown: health.breakdown,
    },
    thresholdWarnings,
    cards: buildOverviewCards(history, currentSnapshot?.recordedAt || live.recordedAt),
    protocolImpact,
    endpointComparison: live.endpointComparison,
  };
}

export async function getNetworkTps(range = DEFAULT_RANGE) {
  const history = await getHistory(range);
  return buildMetricResponse(range, "tps", "Network TPS", "TPS", history, {
    recentAverage: round(average(history.slice(-5).map((item) => item.tps)), 2),
    healthIndicator:
      (history[history.length - 1]?.tps || 0) >= HEALTH_THRESHOLDS.tpsModerate ? "normal" : "low",
  });
}

export async function getNetworkBlockTime(range = DEFAULT_RANGE) {
  const history = await getHistory(range);
  const values = history.map((item) => item.blockTime);
  const averageValue = average(values);
  return buildMetricResponse(range, "blockTime", "Avg Block Time", "s", history, {
    deviation: round(Math.abs((history[history.length - 1]?.blockTime || 0) - averageValue), 3),
    stabilityLabel: averageValue <= HEALTH_THRESHOLDS.blockTimeWatch ? "stable" : "unstable",
  });
}

export async function getNetworkThroughput(range = DEFAULT_RANGE) {
  const history = await getHistory(range);
  return buildMetricResponse(range, "throughput", "Transaction Throughput", "tx/min", history, {
    usageIntensity:
      (history[history.length - 1]?.throughput || 0) >= 10000
        ? "high"
        : (history[history.length - 1]?.throughput || 0) >= 3000
          ? "normal"
          : "light",
  });
}

export async function getNetworkFees(range = DEFAULT_RANGE) {
  const history = await getHistory(range);
  const latest = history[history.length - 1];
  return buildMetricResponse(range, "avgFee", "Average Network Fee", "SOL", history, {
    feeBuckets: latest
      ? {
          low: round(Math.max(latest.avgFee * 0.82, 0.000001), 6),
          average: round(latest.avgFee, 6),
          high: round(Math.max(latest.avgFee * 1.28, latest.avgFee), 6),
        }
      : { low: 0, average: 0, high: 0 },
  });
}

export async function getNetworkValidators(range = DEFAULT_RANGE) {
  const history = await getHistory(range);
  const latest = history[history.length - 1];
  return buildMetricResponse(range, "validatorCount", "Validator Count", "", history, {
    activeValidators: latest?.activeValidators || 0,
    delinquentValidators: latest?.delinquentValidators || 0,
  });
}

export async function getRpcLatencyHistory(range = DEFAULT_RANGE) {
  const history = await getHistory(range);
  const values = history.map((item) => item.rpcLatency);
  return buildMetricResponse(range, "rpcLatency", "RPC Latency", "ms", history, {
    bestRecentLatency: round(Math.min(...values, 0), 0),
    worstRecentLatency: round(Math.max(...values, 0), 0),
    endpointLabel: history[history.length - 1]?.endpointLabel || "Solana Devnet RPC",
  });
}

export async function getNetworkHealth(range = DEFAULT_RANGE) {
  const [history, overview] = await Promise.all([getHistory(range), getNetworkOverview(range)]);
  const healthSeries = history.map((snapshot) => ({
    label: formatRangeLabel(snapshot.recordedAt, range),
    recordedAt: snapshot.recordedAt,
    value: round(snapshot.healthScore, 2),
  }));
  const latencyValues = history.map((item) => item.rpcLatency).filter((value) => Number.isFinite(value));

  return {
    range,
    score: overview.health.score,
    label: overview.health.label,
    status: overview.health.status,
    primaryIssue: overview.health.primaryIssue,
    breakdown: overview.health.breakdown,
    thresholdWarnings: overview.thresholdWarnings,
    protocolImpact: overview.protocolImpact,
    bestRecentLatency: round(latencyValues.length ? Math.min(...latencyValues) : 0, 0),
    worstRecentLatency: round(latencyValues.length ? Math.max(...latencyValues) : 0, 0),
    lastUpdated: overview.lastUpdated,
    healthSeries,
  };
}

export async function getNetworkEvents(limit = 20) {
  await ensureFreshSnapshot();

  const items = await NetworkStatusEvent.find({ network: NETWORK_NAME })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    items,
    lastUpdated: items[0]?.createdAt || null,
  };
}
