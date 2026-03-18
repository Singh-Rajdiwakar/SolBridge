import { Router } from "express";

import { add, detail, feeHistory, list, myPositions, remove, simulate } from "../controllers/pools.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(list));
router.get("/my-positions", asyncHandler(myPositions));
router.get("/fee-history", asyncHandler(feeHistory));
router.get("/:id", asyncHandler(detail));
router.post("/add-liquidity", asyncHandler(add));
router.post("/remove-liquidity", asyncHandler(remove));
router.post("/simulate", asyncHandler(simulate));

export default router;
