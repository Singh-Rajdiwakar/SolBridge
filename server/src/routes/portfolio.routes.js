import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  getPortfolioSnapshots,
  postPortfolioSnapshotRebuild,
} from "../controllers/portfolio.controller.js";

const router = Router();

router.use(authenticate);

router.get("/snapshots/:walletAddress", asyncHandler(getPortfolioSnapshots));
router.post("/snapshot/rebuild", asyncHandler(postPortfolioSnapshotRebuild));

export default router;
