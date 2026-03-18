import { Router } from "express";

import {
  alerts,
  checkTransaction,
  walletScore,
} from "../controllers/security.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.post("/check-transaction", asyncHandler(checkTransaction));
router.get("/wallet-score", asyncHandler(walletScore));
router.get("/alerts", asyncHandler(alerts));

export default router;
