import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  compare,
  create,
  destroy,
  list,
  simulate,
  update,
} from "../controllers/strategy.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(list));
router.post("/", asyncHandler(create));
router.put("/:strategyId", asyncHandler(update));
router.delete("/:strategyId", asyncHandler(destroy));
router.post("/simulate", asyncHandler(simulate));
router.post("/compare", asyncHandler(compare));

export default router;
