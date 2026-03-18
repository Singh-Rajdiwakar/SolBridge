import { networkApi } from "@/services/api";
import type { NetworkMonitorRange } from "@/types";

export const networkMonitorService = {
  getOverview: (range: NetworkMonitorRange = "24H") => networkApi.overview(range),
  getTps: (range: NetworkMonitorRange = "24H") => networkApi.tps(range),
  getBlockTime: (range: NetworkMonitorRange = "24H") => networkApi.blockTime(range),
  getThroughput: (range: NetworkMonitorRange = "24H") => networkApi.throughput(range),
  getFees: (range: NetworkMonitorRange = "24H") => networkApi.fees(range),
  getValidators: (range: NetworkMonitorRange = "24H") => networkApi.validators(range),
  getRpcLatency: (range: NetworkMonitorRange = "24H") => networkApi.rpcLatency(range),
  getHealth: (range: NetworkMonitorRange = "24H") => networkApi.health(range),
  getEvents: (limit = 20) => networkApi.events(limit),
};
