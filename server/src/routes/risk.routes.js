import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  breakdown,
  events,
  recommendations,
  stressTest,
  summary,
  trend,
} from "../controllers/risk.controller.js";

const router = Router();

router.use(authenticate);

router.get("/summary/:walletAddress", asyncHandler(summary));
router.get("/breakdown/:walletAddress", asyncHandler(breakdown));
router.get("/trend/:walletAddress", asyncHandler(trend));
router.post("/stress-test", asyncHandler(stressTest));
router.get("/events/:walletAddress", asyncHandler(events));
router.get("/recommendations/:walletAddress", asyncHandler(recommendations));

export default router;
