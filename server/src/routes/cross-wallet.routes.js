import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  activity,
  createGroup,
  deleteGroup,
  diversity,
  exportGroup,
  listGroups,
  pnl,
  risk,
  summary,
  updateGroup,
  whaleSignals,
} from "../controllers/cross-wallet.controller.js";

const router = Router();

router.use(authenticate);

router.get("/groups", asyncHandler(listGroups));
router.post("/groups", asyncHandler(createGroup));
router.put("/groups/:groupId", asyncHandler(updateGroup));
router.delete("/groups/:groupId", asyncHandler(deleteGroup));
router.get("/summary/:groupId", asyncHandler(summary));
router.get("/pnl/:groupId", asyncHandler(pnl));
router.get("/risk/:groupId", asyncHandler(risk));
router.get("/diversity/:groupId", asyncHandler(diversity));
router.get("/activity/:groupId", asyncHandler(activity));
router.get("/whale-signals/:groupId", asyncHandler(whaleSignals));
router.post("/export/:groupId", asyncHandler(exportGroup));

export default router;
