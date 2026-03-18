import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  getExplorerBlock,
  getExplorerToken,
  getExplorerTransaction,
  getExplorerTransactionFlow,
  getExplorerWallet,
  getExplorerWalletGraph,
} from "../controllers/explorer.controller.js";

const router = Router();

router.use(authenticate);

router.get("/wallet/:address", asyncHandler(getExplorerWallet));
router.get("/tx/:signature", asyncHandler(getExplorerTransaction));
router.get("/token/:mint", asyncHandler(getExplorerToken));
router.get("/block/:slot", asyncHandler(getExplorerBlock));
router.get("/graph/wallet/:address", asyncHandler(getExplorerWalletGraph));
router.get("/flow/:signature", asyncHandler(getExplorerTransactionFlow));

export default router;
