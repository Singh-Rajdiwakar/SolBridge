import { sendSuccess } from "../utils/response.js";
import {
  strategyCompareSchema,
  strategyPlanCreateSchema,
  strategyPlanParamsSchema,
  strategyPlanUpdateSchema,
  strategySimulationInputSchema,
} from "../validators/strategy.validators.js";
import {
  compareStrategies,
  createStrategy,
  deleteStrategy,
  listStrategies,
  simulateStrategy,
  updateStrategy,
} from "../services/strategy.service.js";

export async function list(req, res) {
  return sendSuccess(res, await listStrategies(req.user._id));
}

export async function create(req, res) {
  const payload = strategyPlanCreateSchema.parse(req.body);
  return sendSuccess(res, await createStrategy(req.user._id, payload), 201);
}

export async function update(req, res) {
  const params = strategyPlanParamsSchema.parse(req.params);
  const payload = strategyPlanUpdateSchema.parse(req.body);
  return sendSuccess(res, await updateStrategy(req.user._id, params.strategyId, payload));
}

export async function destroy(req, res) {
  const params = strategyPlanParamsSchema.parse(req.params);
  return sendSuccess(res, await deleteStrategy(req.user._id, params.strategyId));
}

export async function simulate(req, res) {
  const payload = strategySimulationInputSchema.parse(req.body);
  return sendSuccess(res, await simulateStrategy(req.user._id, payload));
}

export async function compare(req, res) {
  const payload = strategyCompareSchema.parse(req.body);
  return sendSuccess(res, await compareStrategies(req.user._id, payload));
}
