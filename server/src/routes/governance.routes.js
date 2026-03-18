import { Router } from "express";

import {
  claim,
  governanceMetadata,
  myVotes,
  postProposal,
  postGovernanceMetadata,
  proposalById,
  proposals,
  stats,
  putGovernanceMetadata,
  vesting,
  vote,
} from "../controllers/governance.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.get("/stats", asyncHandler(stats));
router.get("/proposals", asyncHandler(proposals));
router.get("/proposals/:id", asyncHandler(proposalById));
router.post("/proposals", asyncHandler(postProposal));
router.get("/metadata/:proposalPubkey", asyncHandler(governanceMetadata));
router.post("/metadata", asyncHandler(postGovernanceMetadata));
router.put("/metadata/:proposalPubkey", asyncHandler(putGovernanceMetadata));
router.post("/vote", asyncHandler(vote));
router.get("/my-votes", asyncHandler(myVotes));
router.get("/vesting", asyncHandler(vesting));
router.post("/claim", asyncHandler(claim));

export default router;
