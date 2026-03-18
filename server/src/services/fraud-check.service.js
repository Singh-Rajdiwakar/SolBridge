import { analyzeTransactionRisk } from "./security.service.js";

export async function runFraudCheck(payload) {
  return analyzeTransactionRisk(payload);
}
