import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  getTransactionBySignature,
  listTransactions,
  postTransactionSync,
} from "../controllers/transactions.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listTransactions));
router.get("/:signature", asyncHandler(getTransactionBySignature));
router.post("/sync", asyncHandler(postTransactionSync));

export default router;
