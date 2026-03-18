import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import {
  getAccount,
  getBalance,
  getInsights,
  getNfts,
  getPortfolio,
  getTransactions,
  postAirdrop,
  postCreateAccount,
  postCreateToken,
  postImportAccount,
  postSend,
  postSwap,
} from "../controllers/wallet.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);

router.get("/account", asyncHandler(getAccount));
router.post("/account/create", asyncHandler(postCreateAccount));
router.post("/account/import", asyncHandler(postImportAccount));
router.get("/balance", asyncHandler(getBalance));
router.get("/portfolio", asyncHandler(getPortfolio));
router.get("/transactions", asyncHandler(getTransactions));
router.get("/nfts", asyncHandler(getNfts));
router.get("/insights", asyncHandler(getInsights));
router.post("/send", asyncHandler(postSend));
router.post("/swap", asyncHandler(postSwap));
router.post("/create-token", asyncHandler(postCreateToken));
router.post("/airdrop", asyncHandler(postAirdrop));

export default router;
