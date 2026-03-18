import { Router } from "express";

import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { adminSummary, summary } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(authenticate);

router.get("/summary/:walletAddress", asyncHandler(summary));
router.get("/admin-summary", authorize("admin"), asyncHandler(adminSummary));

export default router;
