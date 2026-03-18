import { simulateTransaction } from "../services/transaction-simulator.service.js";
import { sendSuccess } from "../utils/response.js";
import { transactionSimulationSchema } from "../validators/simulator.validators.js";

export async function simulate(req, res) {
  const payload = transactionSimulationSchema.parse(req.body);
  const result = await simulateTransaction(req.user._id, payload);
  return sendSuccess(res, result);
}
