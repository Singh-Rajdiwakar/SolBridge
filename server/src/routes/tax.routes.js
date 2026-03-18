import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  capitalGains,
  exportCsv,
  exportJson,
  exportPdf,
  lendingIncome,
  stakingIncome,
  summary,
  yearlyGroupReport,
  yearlyReport,
} from "../controllers/tax.controller.js";

const router = Router();

router.use(authenticate);

router.get("/summary/:walletAddress", asyncHandler(summary));
router.get("/capital-gains/:walletAddress", asyncHandler(capitalGains));
router.get("/staking-income/:walletAddress", asyncHandler(stakingIncome));
router.get("/lending-income/:walletAddress", asyncHandler(lendingIncome));
router.get("/yearly-report/:walletAddress", asyncHandler(yearlyReport));
router.get("/group/:groupId/yearly-report", asyncHandler(yearlyGroupReport));
router.post("/export/json", asyncHandler(exportJson));
router.post("/export/csv", asyncHandler(exportCsv));
router.post("/export/pdf", asyncHandler(exportPdf));

export default router;
