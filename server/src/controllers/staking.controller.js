import { z } from "zod";

import {
  calculateStakingProjection,
  claimStakeRewards,
  createStake,
  getStakingHistory,
  getStakingOverview,
  unstakePosition,
} from "../services/staking.service.js";

const createStakeSchema = z.object({
  tokenSymbol: z.string().min(2),
  amount: z.number().positive(),
  durationDays: z.number().int().positive(),
});

const calculateSchema = z.object({
  amount: z.number().positive(),
  durationDays: z.number().int().positive(),
  apy: z.number().positive(),
});

const actionSchema = z.object({
  stakeId: z.string().min(1),
});

export async function overview(req, res) {
  const data = await getStakingOverview(req.user._id, req.query.token);
  return res.json(data);
}

export async function create(req, res) {
  const payload = createStakeSchema.parse(req.body);
  const stake = await createStake(req.user._id, payload);
  return res.status(201).json(stake);
}

export async function calculate(req, res) {
  const payload = calculateSchema.parse(req.body);
  return res.json(calculateStakingProjection(payload));
}

export async function history(req, res) {
  const records = await getStakingHistory(req.user._id, req.query.token);
  return res.json(records);
}

export async function claim(req, res) {
  const payload = actionSchema.parse(req.body);
  const result = await claimStakeRewards(req.user._id, payload.stakeId);
  return res.json(result);
}

export async function unstake(req, res) {
  const payload = actionSchema.parse(req.body);
  const result = await unstakePosition(req.user._id, payload.stakeId);
  return res.json(result);
}
