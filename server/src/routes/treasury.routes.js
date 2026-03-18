import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  treasuryAllocation,
  treasuryAssets,
  treasuryEvents,
  treasuryFlows,
  treasuryGrowth,
  treasuryHealth,
  treasuryOverview,
  treasuryProposals,
  treasuryRunway,
} from "../controllers/treasury.controller.js";

const router = Router();

router.use(authenticate);

router.get("/overview", asyncHandler(treasuryOverview));
router.get("/assets", asyncHandler(treasuryAssets));
router.get("/allocation", asyncHandler(treasuryAllocation));
router.get("/growth", asyncHandler(treasuryGrowth));
router.get("/health", asyncHandler(treasuryHealth));
router.get("/runway", asyncHandler(treasuryRunway));
router.get("/proposals", asyncHandler(treasuryProposals));
router.get("/flows", asyncHandler(treasuryFlows));
router.get("/events", asyncHandler(treasuryEvents));

export default router;
