import { Router } from "express";

import { portfolioAdvice } from "../controllers/ai.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.post("/portfolio-advice", asyncHandler(portfolioAdvice));

export default router;
