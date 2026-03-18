import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  getAlerts,
  getCandles,
  getCompare,
  getMarketStats,
  getTicker,
  getWatchlist,
  postAlert,
  postSimulateTrade,
  postWatchlist,
  removeAlert,
} from "../controllers/trading.controller.js";

const router = Router();

router.use(authenticate);

router.get("/ticker", asyncHandler(getTicker));
router.get("/candles/:symbol", asyncHandler(getCandles));
router.get("/market-stats/:symbol", asyncHandler(getMarketStats));
router.get("/watchlist", asyncHandler(getWatchlist));
router.post("/watchlist", asyncHandler(postWatchlist));
router.get("/alerts", asyncHandler(getAlerts));
router.post("/alerts", asyncHandler(postAlert));
router.delete("/alerts/:id", asyncHandler(removeAlert));
router.post("/simulate-trade", asyncHandler(postSimulateTrade));
router.get("/compare", asyncHandler(getCompare));

export default router;
