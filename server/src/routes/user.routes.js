import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  deleteWatchlist,
  getPreferences,
  getWatchlist,
  postLinkedWallet,
  postWatchlist,
  profile,
  putProfile,
  putPreferences,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authenticate);

router.get("/profile", asyncHandler(profile));
router.put("/profile", asyncHandler(putProfile));
router.get("/watchlist", asyncHandler(getWatchlist));
router.post("/watchlist", asyncHandler(postWatchlist));
router.delete("/watchlist/:symbol", asyncHandler(deleteWatchlist));
router.get("/preferences", asyncHandler(getPreferences));
router.put("/preferences", asyncHandler(putPreferences));
router.post("/linked-wallets", asyncHandler(postLinkedWallet));

export default router;
