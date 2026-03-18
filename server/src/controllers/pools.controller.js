import { z } from "zod";

import {
  addLiquidity,
  getFeeHistory,
  getMyPositions,
  getPoolById,
  listPools,
  removeLiquidity,
  simulatePoolAction,
} from "../services/pools.service.js";

const simulateSchema = z.object({
  poolId: z.string().min(1),
  amountA: z.number().nonnegative(),
  amountB: z.number().nonnegative(),
});

const addLiquiditySchema = z.object({
  poolId: z.string().min(1),
  amountA: z.number().positive(),
  amountB: z.number().positive(),
});

const removeLiquiditySchema = z.object({
  positionId: z.string().min(1),
  percent: z.number().min(1).max(100).optional(),
});

export async function list(req, res) {
  return res.json(await listPools(req.user._id, req.query));
}

export async function detail(req, res) {
  return res.json(await getPoolById(req.user._id, req.params.id));
}

export async function simulate(req, res) {
  return res.json(await simulatePoolAction(simulateSchema.parse(req.body)));
}

export async function add(req, res) {
  return res.status(201).json(await addLiquidity(req.user._id, addLiquiditySchema.parse(req.body)));
}

export async function remove(req, res) {
  return res.json(await removeLiquidity(req.user._id, removeLiquiditySchema.parse(req.body)));
}

export async function myPositions(req, res) {
  return res.json(await getMyPositions(req.user._id));
}

export async function feeHistory(req, res) {
  return res.json(await getFeeHistory(req.user._id));
}
