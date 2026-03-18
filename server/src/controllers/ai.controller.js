import { getPortfolioAdvice } from "../services/portfolio-ai.service.js";
import { sendSuccess } from "../utils/response.js";
import { portfolioAdviceSchema } from "../validators/ai.validators.js";

export async function portfolioAdvice(req, res) {
  const payload = portfolioAdviceSchema.parse(req.body);
  const result = await getPortfolioAdvice({
    userId: req.user._id,
    portfolio: payload.portfolio,
    historicalData: payload.historicalData,
  });
  return sendSuccess(res, result);
}
