import { z } from "zod";

import {
  borrowAsset,
  getLendingHistory,
  getMarkets,
  getPosition,
  repayAsset,
  simulateBorrow,
  supplyAsset,
  withdrawAsset,
} from "../services/lending.service.js";

const actionSchema = z.object({
  token: z.string().min(1),
  amount: z.number().positive(),
});

const simulateSchema = z.object({
  asset: z.string().min(1),
  borrowAmount: z.number().nonnegative().optional(),
  priceDropPercent: z.number().nonnegative().max(100).optional(),
});

export async function markets(req, res) {
  return res.json(await getMarkets(req.user._id));
}

export async function position(req, res) {
  return res.json(await getPosition(req.user._id));
}

export async function supply(req, res) {
  return res.json(await supplyAsset(req.user._id, actionSchema.parse(req.body)));
}

export async function withdraw(req, res) {
  return res.json(await withdrawAsset(req.user._id, actionSchema.parse(req.body)));
}

export async function borrow(req, res) {
  return res.json(await borrowAsset(req.user._id, actionSchema.parse(req.body)));
}

export async function repay(req, res) {
  return res.json(await repayAsset(req.user._id, actionSchema.parse(req.body)));
}

export async function simulate(req, res) {
  return res.json(await simulateBorrow(req.user._id, simulateSchema.parse(req.body)));
}

export async function history(req, res) {
  return res.json(await getLendingHistory(req.user._id));
}
