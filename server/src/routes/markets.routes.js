import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  getChart,
  getCoin,
  getCoins,
  getGainers,
  getLosers,
  getOverview,
  getUserWatchlist,
  postProfitLoss,
  postUserWatchlist,
} from "../controllers/markets.controller.js";

const router = Router();

router.use(authenticate);

router.get("/overview", asyncHandler(getOverview));
router.get("/coins", asyncHandler(getCoins));
router.get("/coin/:id", asyncHandler(getCoin));
router.get("/chart/:id", asyncHandler(getChart));
router.get("/gainers", asyncHandler(getGainers));
router.get("/losers", asyncHandler(getLosers));
router.post("/profit-loss", asyncHandler(postProfitLoss));
router.get("/watchlist", asyncHandler(getUserWatchlist));
router.post("/watchlist", asyncHandler(postUserWatchlist));

export default router;
