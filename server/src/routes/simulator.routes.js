import { Router } from "express";

import { simulate } from "../controllers/simulator.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.post("/transaction", asyncHandler(simulate));

export default router;
