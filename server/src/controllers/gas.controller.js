import { getGasOptimization } from "../services/gas-optimizer.service.js";
import { sendSuccess } from "../utils/response.js";
import { gasOptimizeQuerySchema } from "../validators/gas.validators.js";

export async function optimize(req, res) {
  gasOptimizeQuerySchema.parse(req.query);
  const result = await getGasOptimization(req.user._id);
  return sendSuccess(res, result);
}
