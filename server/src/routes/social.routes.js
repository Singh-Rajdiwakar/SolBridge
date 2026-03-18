import { Router } from "express";

import { authenticate, optionalAuthenticate } from "../middlewares/auth.js";
import {
  badges,
  deleteFollow,
  feed,
  following,
  leaderboards,
  postFollow,
  postShareSnapshot,
  profile,
  putProfile,
  search,
  snapshots,
  trending,
} from "../controllers/social.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get("/trending", asyncHandler(trending));
router.get("/leaderboards", asyncHandler(leaderboards));
router.get("/profile/:walletAddress", optionalAuthenticate, asyncHandler(profile));
router.get("/snapshots/:walletAddress", optionalAuthenticate, asyncHandler(snapshots));
router.get("/badges/:walletAddress", optionalAuthenticate, asyncHandler(badges));
router.get("/search", asyncHandler(search));
router.get("/feed", asyncHandler(feed));

router.use(authenticate);

router.put("/profile/:walletAddress", asyncHandler(putProfile));
router.post("/follow/:walletAddress", asyncHandler(postFollow));
router.delete("/follow/:walletAddress", asyncHandler(deleteFollow));
router.get("/following", asyncHandler(following));
router.post("/share-snapshot", asyncHandler(postShareSnapshot));

export default router;
