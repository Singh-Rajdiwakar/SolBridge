import { Router } from "express";

import {
  history,
  insights,
  opportunities,
  rebalancing,
  refresh,
  riskWarnings,
  summary,
  yieldSuggestions,
} from "../controllers/assistant.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.get("/summary/:walletAddress", asyncHandler(summary));
router.get("/insights/:walletAddress", asyncHandler(insights));
router.get("/yield-suggestions/:walletAddress", asyncHandler(yieldSuggestions));
router.get("/risk-warnings/:walletAddress", asyncHandler(riskWarnings));
router.get("/rebalancing/:walletAddress", asyncHandler(rebalancing));
router.get("/opportunities/:walletAddress", asyncHandler(opportunities));
router.get("/history/:walletAddress", asyncHandler(history));
router.post("/refresh/:walletAddress", asyncHandler(refresh));

export default router;
