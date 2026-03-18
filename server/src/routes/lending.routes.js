import { Router } from "express";

import {
  borrow,
  history,
  markets,
  position,
  repay,
  simulate,
  supply,
  withdraw,
} from "../controllers/lending.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.get("/markets", asyncHandler(markets));
router.get("/position", asyncHandler(position));
router.post("/supply", asyncHandler(supply));
router.post("/withdraw", asyncHandler(withdraw));
router.post("/borrow", asyncHandler(borrow));
router.post("/repay", asyncHandler(repay));
router.post("/simulate", asyncHandler(simulate));
router.get("/history", asyncHandler(history));

export default router;
