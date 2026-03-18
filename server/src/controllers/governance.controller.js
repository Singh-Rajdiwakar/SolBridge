import { z } from "zod";

import {
  claimGovernanceRewards,
  createProposal,
  getGovernanceStats,
  getMyVotes,
  getProposalById,
  getVestingDetails,
  listProposals,
  submitVote,
} from "../services/governance.service.js";
import {
  createGovernanceMetadata,
  getGovernanceMetadata as getGovernanceMetadataRecord,
  updateGovernanceMetadata as updateGovernanceMetadataRecord,
} from "../services/governance-metadata.service.js";
import {
  governanceMetadataParamsSchema,
  governanceMetadataSchema,
  governanceMetadataUpdateSchema,
} from "../validators/governance-metadata.validators.js";
import { sendSuccess } from "../utils/response.js";

const proposalSchema = z.object({
  title: z.string().min(4),
  category: z.string().min(2),
  description: z.string().min(12),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  quorum: z.number().positive(),
});

const voteSchema = z.object({
  proposalId: z.string().min(1),
  voteType: z.enum(["yes", "no", "abstain"]),
});

export async function stats(req, res) {
  return sendSuccess(res, await getGovernanceStats(req.user._id));
}

export async function proposals(req, res) {
  return sendSuccess(res, await listProposals(req.query.status));
}

export async function proposalById(req, res) {
  return sendSuccess(res, await getProposalById(req.params.id));
}

export async function postProposal(req, res) {
  const payload = proposalSchema.parse(req.body);
  return sendSuccess(res, await createProposal(req.user, payload), 201);
}

export async function vote(req, res) {
  return sendSuccess(res, await submitVote(req.user._id, voteSchema.parse(req.body)));
}

export async function myVotes(req, res) {
  return sendSuccess(res, await getMyVotes(req.user._id));
}

export async function vesting(req, res) {
  return sendSuccess(res, await getVestingDetails(req.user._id));
}

export async function claim(req, res) {
  return sendSuccess(res, await claimGovernanceRewards(req.user._id));
}

export async function governanceMetadata(req, res) {
  const params = governanceMetadataParamsSchema.parse(req.params);
  return sendSuccess(res, await getGovernanceMetadataRecord(params.proposalPubkey));
}

export async function postGovernanceMetadata(req, res) {
  const payload = governanceMetadataSchema.parse(req.body);
  return sendSuccess(res, await createGovernanceMetadata(payload), 201);
}

export async function putGovernanceMetadata(req, res) {
  const params = governanceMetadataParamsSchema.parse(req.params);
  const payload = governanceMetadataUpdateSchema.parse(req.body);
  return sendSuccess(res, await updateGovernanceMetadataRecord(params.proposalPubkey, payload));
}
