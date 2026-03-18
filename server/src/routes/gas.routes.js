import { Router } from "express";

import { optimize } from "../controllers/gas.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.get("/optimize", asyncHandler(optimize));

export default router;
