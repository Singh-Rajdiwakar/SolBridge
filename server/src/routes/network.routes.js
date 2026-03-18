import { Router } from "express";

import {
  blockTime,
  events,
  fees,
  health,
  overview,
  rpcLatency,
  throughput,
  tps,
  validators,
} from "../controllers/network.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get("/overview", asyncHandler(overview));
router.get("/tps", asyncHandler(tps));
router.get("/block-time", asyncHandler(blockTime));
router.get("/throughput", asyncHandler(throughput));
router.get("/fees", asyncHandler(fees));
router.get("/validators", asyncHandler(validators));
router.get("/rpc-latency", asyncHandler(rpcLatency));
router.get("/health", asyncHandler(health));
router.get("/events", asyncHandler(events));

export default router;
