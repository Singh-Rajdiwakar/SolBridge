import { TransactionMirror } from "../models/TransactionMirror.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";
import {
  buildExplorerUrl,
  getParsedTransactionDetails,
  getTransactions,
  parsePublicKey,
} from "./solana.service.js";

function classifyProtocolModule(type = "", metadata = {}) {
  const normalized = type.toLowerCase();
  if (metadata.protocolModule) {
    return metadata.protocolModule;
  }
  if (normalized.includes("stake") || normalized.includes("reward")) {
    return "staking";
  }
  if (normalized.includes("liquidity") || normalized.includes("swap")) {
    return "liquidity";
  }
  if (normalized.includes("borrow") || normalized.includes("repay") || normalized.includes("collateral")) {
    return "lending";
  }
  if (normalized.includes("vote") || normalized.includes("proposal")) {
    return "governance";
  }
  if (normalized.includes("token")) {
    return "token";
  }
  if (normalized.includes("sent") || normalized.includes("received") || normalized.includes("airdrop")) {
    return "wallet";
  }
  return "unknown";
}

function extractAddresses(parsed) {
  const accountKeys = parsed?.transaction?.message?.accountKeys || [];
  const signer = accountKeys.find((key) => key.signer)?.pubkey?.toBase58?.() || accountKeys[0]?.pubkey?.toBase58?.();
  const destination =
    accountKeys.find((key, index) => !key.signer && index > 0)?.pubkey?.toBase58?.() || "";

  return {
    fromAddress: signer || "",
    toAddress: destination,
  };
}

function normalizeMirrorRecord(record) {
  const item = record.toObject ? record.toObject() : record;
  return {
    ...item,
    explorerUrl: item.explorerUrl || buildExplorerUrl(item.signature),
  };
}

export async function mirrorTransactionRecord(payload) {
  if (!payload.signature) {
    return null;
  }

  const record = await TransactionMirror.findOneAndUpdate(
    { signature: payload.signature },
    {
      walletAddress: payload.walletAddress,
      userId: payload.userId,
      signature: payload.signature,
      type: payload.type,
      protocolModule: classifyProtocolModule(payload.type, payload.metadata),
      tokenSymbol: payload.tokenSymbol || "",
      amount: payload.amount || 0,
      fromAddress: payload.fromAddress || "",
      toAddress: payload.toAddress || "",
      status: payload.status || "confirmed",
      slot: payload.slot || 0,
      blockTime: payload.blockTime || new Date(),
      explorerUrl: payload.explorerUrl || buildExplorerUrl(payload.signature),
      metadata: payload.metadata || {},
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return normalizeMirrorRecord(record);
}

export async function listMirroredTransactions({
  walletAddress,
  userId,
  protocolModule,
  search,
  status,
  page = 1,
  limit = 20,
}) {
  const filter = {
    ...(walletAddress ? { walletAddress } : {}),
    ...(userId ? { userId } : {}),
    ...(protocolModule ? { protocolModule } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          $or: [
            { signature: { $regex: search, $options: "i" } },
            { type: { $regex: search, $options: "i" } },
            { tokenSymbol: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    TransactionMirror.find(filter)
      .sort({ blockTime: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    TransactionMirror.countDocuments(filter),
  ]);

  return {
    items: items.map(normalizeMirrorRecord),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    source: "mirror",
  };
}

export async function getMirroredTransactionBySignature(signature) {
  const record = await TransactionMirror.findOne({ signature });
  if (!record) {
    throw new AppError("Mirrored transaction not found", 404);
  }

  return normalizeMirrorRecord(record);
}

export async function syncMirroredTransactions({ walletAddress, userId, limit = 20 }) {
  const normalizedAddress = parsePublicKey(walletAddress).toBase58();
  const signatures = await getTransactions(normalizedAddress, limit);

  const upserts = await Promise.all(
    signatures.map(async (entry) => {
      const parsed = await getParsedTransactionDetails(entry.signature).catch(() => null);
      const addresses = extractAddresses(parsed);

      return mirrorTransactionRecord({
        walletAddress: normalizedAddress,
        userId,
        signature: entry.signature,
        type: parsed ? "Chain Transaction" : "Signature Mirror",
        protocolModule: "wallet",
        tokenSymbol: "SOL",
        amount: 0,
        fromAddress: addresses.fromAddress,
        toAddress: addresses.toAddress,
        status: entry.err ? "failed" : entry.confirmationStatus || "confirmed",
        slot: entry.slot,
        blockTime: entry.blockTime ? new Date(entry.blockTime * 1000) : new Date(),
        metadata: {
          source: "rpc-mirror",
          memo: parsed?.transaction?.message?.instructions?.length || 0,
        },
      });
    }),
  );

  logger.info("transactions.sync.completed", {
    walletAddress: normalizedAddress,
    synced: upserts.filter(Boolean).length,
  });

  return {
    walletAddress: normalizedAddress,
    synced: upserts.filter(Boolean).length,
    items: upserts.filter(Boolean).map(normalizeMirrorRecord),
    source: "mirror",
  };
}

export async function syncMirroredTransactionsForTrackedWallets(limit = 20) {
  const users = await User.find({}, "_id walletAddress linkedWallets").lean();
  const wallets = users.flatMap((user) => {
    const linked = (user.linkedWallets || []).map((wallet) => wallet.address);
    const addresses = Array.from(new Set([user.walletAddress, ...linked].filter(Boolean)));
    return addresses.map((address) => ({ userId: user._id, walletAddress: address }));
  });

  const results = [];
  for (const wallet of wallets) {
    const syncResult = await syncMirroredTransactions({
      walletAddress: wallet.walletAddress,
      userId: wallet.userId,
      limit,
    }).catch((error) => ({
      walletAddress: wallet.walletAddress,
      synced: 0,
      error: error.message,
    }));
    results.push(syncResult);
  }

  return {
    wallets: results.length,
    synced: results.reduce((sum, result) => sum + (result.synced || 0), 0),
    results,
  };
}
