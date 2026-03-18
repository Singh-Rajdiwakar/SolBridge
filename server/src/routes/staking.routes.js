import { Router } from "express";

import { claim, create, history, overview, unstake, calculate } from "../controllers/staking.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.get("/overview", asyncHandler(overview));
router.post("/create", asyncHandler(create));
router.post("/calculate", asyncHandler(calculate));
router.get("/history", asyncHandler(history));
router.post("/claim", asyncHandler(claim));
router.post("/unstake", asyncHandler(unstake));

export default router;
