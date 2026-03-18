import { Transaction } from "../models/Transaction.js";
import { buildExplorerUrl } from "./solana.service.js";
import { mirrorTransactionRecord } from "./wallet-mirror.service.js";

function getDefaultConfidenceScore(record) {
  if (record.status === "failed") {
    return 18;
  }
  if (record.status === "pending") {
    return 72;
  }
  return 95;
}

export function mapTransactionRecord(transaction) {
  const record = transaction.toObject ? transaction.toObject() : transaction;

  return {
    ...record,
    confidenceScore: record.metadata?.confidenceScore ?? getDefaultConfidenceScore(record),
    riskLevel: record.metadata?.riskLevel,
    explorerUrl:
      record.signature && !record.metadata?.simulated ? buildExplorerUrl(record.signature) : undefined,
  };
}

export async function createTransactionRecord(payload) {
  const transaction = await Transaction.create(payload);
  if (payload.signature) {
    await mirrorTransactionRecord({
      walletAddress: payload.metadata?.walletAddress || payload.receiver || "",
      userId: payload.userId,
      signature: payload.signature,
      type: payload.type,
      tokenSymbol: payload.token,
      amount: payload.amount,
      fromAddress: payload.metadata?.walletAddress || "",
      toAddress: payload.receiver || "",
      status: payload.status,
      metadata: {
        ...(payload.metadata || {}),
        source: "transaction-record",
      },
    }).catch(() => null);
  }
  return mapTransactionRecord(transaction);
}

export async function listTransactionRecords({
  userId,
  address,
  page = 1,
  limit = 20,
  types,
}) {
  const filter = {
    userId,
    ...(types?.length ? { type: { $in: types } } : {}),
    ...(address ? { "metadata.walletAddress": address } : {}),
  };

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  return {
    items: items.map(mapTransactionRecord),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
