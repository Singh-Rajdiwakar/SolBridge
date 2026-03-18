import { Router } from "express";

import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  governanceAnalytics,
  lendingAnalytics,
  liquidityAnalytics,
  protocolAnalytics,
  stakingAnalytics,
  walletAnalytics,
} from "../controllers/analytics.controller.js";

const router = Router();

router.use(authenticate);

router.get("/wallet/:walletAddress", asyncHandler(walletAnalytics));
router.get("/staking/:walletAddress", asyncHandler(stakingAnalytics));
router.get("/liquidity/:walletAddress", asyncHandler(liquidityAnalytics));
router.get("/lending/:walletAddress", asyncHandler(lendingAnalytics));
router.get("/governance/:walletAddress", asyncHandler(governanceAnalytics));
router.get("/protocol", authorize("admin"), asyncHandler(protocolAnalytics));

export default router;
