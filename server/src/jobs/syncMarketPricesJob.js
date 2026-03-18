import { syncMarketPriceSnapshots } from "../services/market-data.service.js";
import { runTrackedJob } from "./job-runner.js";

export async function syncMarketPricesJob(currency = "usd") {
  return runTrackedJob("sync-market-prices", async () => syncMarketPriceSnapshots(currency));
}
