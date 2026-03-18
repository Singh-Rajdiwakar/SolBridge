import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  destroyAlert,
  getAlerts,
  postAlert,
  putAlert,
} from "../controllers/alerts.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(getAlerts));
router.post("/", asyncHandler(postAlert));
router.put("/:id", asyncHandler(putAlert));
router.delete("/:id", asyncHandler(destroyAlert));

export default router;
