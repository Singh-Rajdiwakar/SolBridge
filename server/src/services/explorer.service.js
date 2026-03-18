import { getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { env } from "../config/env.js";
import { AddressBook } from "../models/AddressBook.js";
import { Token } from "../models/Token.js";
import { TransactionMirror } from "../models/TransactionMirror.js";
import { AppError } from "../utils/app-error.js";
import {
  buildExplorerAddressUrl,
  buildExplorerUrl,
  getBalance,
  getParsedTokenAccounts,
  getParsedTransactionDetails,
  getSolanaConnection,
  getTransactions,
  parsePublicKey,
} from "./solana.service.js";

const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";

const KNOWN_PROGRAMS = [
  {
    id: env.stakingProgramId,
    label: "Staking Program",
    module: "staking",
    badge: "Staking",
  },
  {
    id: env.liquidityProgramId,
    label: "Liquidity Program",
    module: "liquidity",
    badge: "Liquidity",
  },
  {
    id: env.lendingProgramId,
    label: "Lending Program",
    module: "lending",
    badge: "Lending",
  },
  {
    id: env.governanceProgramId,
    label: "Governance Program",
    module: "governance",
    badge: "Governance",
  },
  {
    id: TOKEN_PROGRAM_ID.toBase58(),
    label: "SPL Token Program",
    module: "token",
    badge: "SPL Token",
  },
  {
    id: ASSOCIATED_TOKEN_PROGRAM_ID,
    label: "Associated Token Program",
    module: "token",
    badge: "Associated Token",
  },
  {
    id: SYSTEM_PROGRAM_ID,
    label: "System Program",
    module: "wallet",
    badge: "Wallet Transfer",
  },
];

function shorten(value, prefix = 4, suffix = 4) {
  if (!value || value.length <= prefix + suffix + 3) {
    return value || "";
  }
  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`;
}

function toBase58Value(value) {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value.toBase58 === "function") {
    return value.toBase58();
  }
  if (typeof value.pubkey?.toBase58 === "function") {
    return value.pubkey.toBase58();
  }
  return String(value);
}

function toDateString(blockTime) {
  if (!blockTime) {
    return null;
  }
  return new Date(blockTime * 1000).toISOString();
}

function buildBlockExplorerUrl(slot) {
  return `https://explorer.solana.com/block/${slot}?cluster=devnet`;
}

function getProgramDescriptor(programId) {
  const resolvedId = toBase58Value(programId);
  return (
    KNOWN_PROGRAMS.find((entry) => entry.id === resolvedId) || {
      id: resolvedId,
      label: "Unknown Program",
      module: "unknown",
      badge: "Unknown",
    }
  );
}

function summarizeInfo(info) {
  if (!info || typeof info !== "object") {
    return "";
  }

  const entries = Object.entries(info)
    .slice(0, 4)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        if ("uiAmountString" in value) {
          return `${key}: ${value.uiAmountString}`;
        }
        return `${key}: ${JSON.stringify(value).slice(0, 48)}`;
      }
      return `${key}: ${String(value)}`;
    });

  return entries.join(" | ");
}

function getInstructionProgramId(instruction) {
  return toBase58Value(instruction?.programId || instruction?.parsed?.info?.programId || instruction?.program);
}

function buildInstructionRecord(instruction, index) {
  const programId = getInstructionProgramId(instruction);
  const descriptor = getProgramDescriptor(programId);
  const parsedType = instruction?.parsed?.type || "";
  const parsedInfo = instruction?.parsed?.info || {};

  return {
    index,
    programId,
    programLabel: descriptor.label,
    protocolModule: descriptor.module,
    type: parsedType || instruction?.program || "instruction",
    parsed: Boolean(instruction?.parsed),
    summary: parsedType
      ? `${parsedType} • ${summarizeInfo(parsedInfo)}`
      : `Raw instruction • ${instruction?.accounts?.length || 0} accounts`,
    accounts: Array.isArray(instruction?.accounts) ? instruction.accounts.map(toBase58Value) : [],
  };
}

function buildTransferSummary(parsedTransaction) {
  const instructions = parsedTransaction?.transaction?.message?.instructions || [];

  return instructions
    .map((instruction) => {
      const type = instruction?.parsed?.type;
      const info = instruction?.parsed?.info || {};
      const programId = getInstructionProgramId(instruction);
      const descriptor = getProgramDescriptor(programId);

      if (!type) {
        return null;
      }

      if (type === "transfer") {
        return {
          kind: descriptor.module === "token" ? "token-transfer" : "sol-transfer",
          source: info.source || info.authority || "",
          destination: info.destination || "",
          amount:
            Number(info.tokenAmount?.uiAmount || info.lamports / LAMPORTS_PER_SOL || info.amount || 0) || 0,
          mint: info.mint || null,
          authority: info.authority || "",
          programId,
          programLabel: descriptor.label,
          symbol: info.mint ? "SPL" : "SOL",
        };
      }

      if (type === "transferChecked") {
        return {
          kind: "token-transfer",
          source: info.source || "",
          destination: info.destination || "",
          amount: Number(info.tokenAmount?.uiAmount || info.amount || 0) || 0,
          mint: info.mint || null,
          authority: info.authority || "",
          programId,
          programLabel: descriptor.label,
          symbol: "SPL",
        };
      }

      if (type === "mintTo" || type === "mintToChecked") {
        return {
          kind: "token-mint",
          source: info.mintAuthority || "",
          destination: info.account || info.destination || "",
          amount: Number(info.tokenAmount?.uiAmount || info.amount || 0) || 0,
          mint: info.mint || null,
          authority: info.mintAuthority || "",
          programId,
          programLabel: descriptor.label,
          symbol: "SPL",
        };
      }

      if (type === "burn" || type === "burnChecked") {
        return {
          kind: "token-burn",
          source: info.account || "",
          destination: info.owner || "",
          amount: Number(info.tokenAmount?.uiAmount || info.amount || 0) || 0,
          mint: info.mint || null,
          authority: info.owner || "",
          programId,
          programLabel: descriptor.label,
          symbol: "SPL",
        };
      }

      return null;
    })
    .filter(Boolean);
}

function classifyProtocol(programDescriptors, transferSummary) {
  const known = programDescriptors.find((descriptor) => descriptor.module !== "token" && descriptor.module !== "wallet" && descriptor.module !== "unknown");
  if (known) {
    return known.badge;
  }
  if (transferSummary.some((item) => item.kind === "token-mint")) {
    return "Token Mint";
  }
  if (transferSummary.some((item) => item.kind === "token-transfer")) {
    return "SPL Token";
  }
  if (transferSummary.some((item) => item.kind === "sol-transfer")) {
    return "Wallet Transfer";
  }
  return "On-chain Activity";
}

async function getViewerAddressLabels(viewerUser, addresses) {
  if (!viewerUser || !addresses.length) {
    return new Map();
  }

  const normalized = Array.from(new Set(addresses.filter(Boolean)));
  const [contacts] = await Promise.all([
    AddressBook.find({
      userId: viewerUser._id,
      walletAddress: { $in: normalized },
    }).lean(),
  ]);

  const labels = new Map();

  for (const contact of contacts) {
    labels.set(contact.walletAddress, {
      label: contact.name,
      note: contact.notes || "",
      source: "address-book",
    });
  }

  if (viewerUser.walletAddress) {
    labels.set(viewerUser.walletAddress, {
      label: "Primary Wallet",
      note: "",
      source: "profile",
    });
  }

  for (const linkedWallet of viewerUser.linkedWallets || []) {
    labels.set(linkedWallet.address, {
      label: linkedWallet.label || shorten(linkedWallet.address),
      note: linkedWallet.notes || "",
      source: "linked-wallet",
    });
  }

  return labels;
}

function normalizeCounterparties(counterpartyMap, labels) {
  return Array.from(counterpartyMap.values())
    .sort((a, b) => b.txCount - a.txCount || b.totalVolume - a.totalVolume)
    .slice(0, 8)
    .map((item) => {
      const labelMeta = labels.get(item.address);
      return {
        address: item.address,
        shortAddress: shorten(item.address),
        label: labelMeta?.label || item.label || shorten(item.address),
        tag: labelMeta?.source || item.tag || "observed",
        txCount: item.txCount,
        totalVolume: Number(item.totalVolume.toFixed(4)),
        latestInteractionAt: item.latestInteractionAt,
        explorerUrl: buildExplorerAddressUrl(item.address),
      };
    });
}

function addCounterparty(counterpartyMap, address, transaction) {
  if (!address) {
    return;
  }

  const existing = counterpartyMap.get(address) || {
    address,
    txCount: 0,
    totalVolume: 0,
    latestInteractionAt: null,
  };

  existing.txCount += 1;
  existing.totalVolume += Number(transaction.amount || 0);
  existing.latestInteractionAt = existing.latestInteractionAt || transaction.latestInteractionAt || transaction.createdAt || null;
  counterpartyMap.set(address, existing);
}

async function buildFallbackCounterparties(address, signatures) {
  const parsedTransactions = await Promise.all(
    signatures.slice(0, 6).map((entry) => getParsedTransactionDetails(entry.signature).catch(() => null)),
  );
  const counterparties = new Map();

  parsedTransactions.forEach((parsed) => {
    const transfers = buildTransferSummary(parsed);
    transfers.forEach((transfer) => {
      if (transfer.source === address && transfer.destination) {
        addCounterparty(counterparties, transfer.destination, {
          amount: transfer.amount,
          latestInteractionAt: toDateString(parsed?.blockTime),
        });
      }
      if (transfer.destination === address && transfer.source) {
        addCounterparty(counterparties, transfer.source, {
          amount: transfer.amount,
          latestInteractionAt: toDateString(parsed?.blockTime),
        });
      }
    });
  });

  return counterparties;
}

function buildWalletTags(walletAddress, balanceSol, exposures, counterparties) {
  const tags = ["Verified on-chain"];

  if (balanceSol >= 100) {
    tags.push("Whale");
  }
  if (exposures.governance > 0) {
    tags.push("Governance Participant");
  }
  if (exposures.liquidity > 0) {
    tags.push("Liquidity Provider");
  }
  if (counterparties.length >= 5) {
    tags.push("High Activity");
  }
  if (!walletAddress) {
    return tags;
  }
  return tags;
}

export async function getWalletExplorerData(address, viewerUser) {
  const normalizedAddress = parsePublicKey(address).toBase58();
  const connection = getSolanaConnection();

  const [balance, tokenAccounts, signatures, mirroredTransactions] = await Promise.all([
    getBalance(normalizedAddress),
    getParsedTokenAccounts(normalizedAddress),
    getTransactions(normalizedAddress, 12),
    TransactionMirror.find({
      $or: [
        { walletAddress: normalizedAddress },
        { fromAddress: normalizedAddress },
        { toAddress: normalizedAddress },
      ],
    })
      .sort({ blockTime: -1, createdAt: -1 })
      .limit(40)
      .lean(),
  ]);

  const tokenMetadata = await Token.find({
    mintAddress: { $in: tokenAccounts.map((entry) => entry.mint) },
  }).lean();
  const tokenMap = new Map(tokenMetadata.map((token) => [token.mintAddress, token]));

  const counterparties = new Map();
  const protocolExposureMap = {
    staking: 0,
    liquidity: 0,
    lending: 0,
    governance: 0,
  };
  const programUsageMap = new Map();
  let largestRecentTransaction = null;

  for (const transaction of mirroredTransactions) {
    const otherAddress =
      transaction.fromAddress === normalizedAddress ? transaction.toAddress : transaction.fromAddress;
    addCounterparty(counterparties, otherAddress, transaction);

    if (transaction.protocolModule in protocolExposureMap) {
      protocolExposureMap[transaction.protocolModule] += 1;
    }

    const tokenKey = transaction.tokenSymbol || "SOL";
    programUsageMap.set(tokenKey, (programUsageMap.get(tokenKey) || 0) + 1);

    if (!largestRecentTransaction || Number(transaction.amount || 0) > largestRecentTransaction.amount) {
      largestRecentTransaction = {
        signature: transaction.signature,
        amount: Number(transaction.amount || 0),
        tokenSymbol: transaction.tokenSymbol || "SOL",
        type: transaction.type,
        createdAt: transaction.blockTime?.toISOString?.() || transaction.createdAt?.toISOString?.() || null,
        explorerUrl: transaction.explorerUrl || buildExplorerUrl(transaction.signature),
      };
    }
  }

  if (!counterparties.size && signatures.length) {
    const fallbackCounterparties = await buildFallbackCounterparties(normalizedAddress, signatures);
    fallbackCounterparties.forEach((value, key) => counterparties.set(key, value));
  }

  const labelMap = await getViewerAddressLabels(
    viewerUser,
    [normalizedAddress, ...Array.from(counterparties.keys())],
  );

  const recentTransactions = mirroredTransactions.length
    ? mirroredTransactions.slice(0, 10).map((transaction) => ({
        signature: transaction.signature,
        shortSignature: shorten(transaction.signature, 10, 8),
        slot: transaction.slot || 0,
        blockTime: transaction.blockTime?.toISOString?.() || transaction.createdAt?.toISOString?.() || null,
        status: transaction.status || "confirmed",
        protocolModule: transaction.protocolModule || "wallet",
        type: transaction.type,
        amount: Number(transaction.amount || 0),
        tokenSymbol: transaction.tokenSymbol || "SOL",
        explorerUrl: transaction.explorerUrl || buildExplorerUrl(transaction.signature),
      }))
    : signatures.map((signature) => ({
        signature: signature.signature,
        shortSignature: shorten(signature.signature, 10, 8),
        slot: signature.slot || 0,
        blockTime: toDateString(signature.blockTime),
        status: signature.err ? "failed" : signature.confirmationStatus || "confirmed",
        protocolModule: "wallet",
        type: "Chain Transaction",
        amount: 0,
        tokenSymbol: "SOL",
        explorerUrl: buildExplorerUrl(signature.signature),
      }));

  const tokenBalances = tokenAccounts
    .filter((entry) => Number(entry.amount || 0) > 0)
    .map((entry) => {
      const metadata = tokenMap.get(entry.mint);
      return {
        mint: entry.mint,
        symbol: metadata?.symbol || shorten(entry.mint, 4, 4),
        name: metadata?.name || "SPL Token",
        amount: Number(entry.amount || 0),
        decimals: Number(entry.decimals || 0),
        usdValue: metadata?.price ? Number((metadata.price * entry.amount).toFixed(2)) : 0,
        explorerUrl: buildExplorerAddressUrl(entry.mint),
      };
    })
    .sort((a, b) => b.usdValue - a.usdValue || b.amount - a.amount);

  const interactedWallets = normalizeCounterparties(counterparties, labelMap);
  const latestActivityAt = recentTransactions[0]?.blockTime || null;
  const largestWallet = interactedWallets[0] || null;
  const frequentlyMovedToken =
    Array.from(programUsageMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "SOL";

  return {
    queryType: "wallet",
    verifiedOnChain: true,
    walletAddress: normalizedAddress,
    shortAddress: shorten(normalizedAddress, 6, 5),
    addressLabel: labelMap.get(normalizedAddress)?.label || "Tracked Wallet",
    note: labelMap.get(normalizedAddress)?.note || "",
    explorerUrl: buildExplorerAddressUrl(normalizedAddress),
    solBalance: balance.sol,
    lamports: balance.lamports,
    tokenBalances,
    tokenAccountsCount: tokenBalances.length,
    recentTransactionCount: signatures.length,
    latestActivityAt,
    nftCount: null,
    protocolExposure: [
      { module: "staking", label: "Staking", activityCount: protocolExposureMap.staking },
      { module: "liquidity", label: "Liquidity", activityCount: protocolExposureMap.liquidity },
      { module: "lending", label: "Lending", activityCount: protocolExposureMap.lending },
      { module: "governance", label: "Governance", activityCount: protocolExposureMap.governance },
    ],
    interactedWallets,
    relatedEntityDiscovery: {
      topCounterparties: interactedWallets.slice(0, 4),
      mostActivePrograms: Object.entries(protocolExposureMap)
        .sort((a, b) => b[1] - a[1])
        .map(([module, count]) => ({
          module,
          label: module[0].toUpperCase() + module.slice(1),
          count,
        })),
      frequentlyMovedToken,
      largestRecentTransaction,
      topInteractionWallet: largestWallet,
    },
    tags: buildWalletTags(normalizedAddress, balance.sol, protocolExposureMap, interactedWallets),
    recentTransactions,
    source: "on-chain+mirror",
  };
}

function buildProgramSummaries(parsedTransaction) {
  const instructions = parsedTransaction?.transaction?.message?.instructions || [];
  const summaries = instructions.map(buildInstructionRecord);
  const programMap = new Map();

  summaries.forEach((summary) => {
    if (!programMap.has(summary.programId)) {
      const descriptor = getProgramDescriptor(summary.programId);
      programMap.set(summary.programId, {
        programId: summary.programId,
        label: descriptor.label,
        protocolModule: descriptor.module,
        badge: descriptor.badge,
        matchesKnownProgram: descriptor.module !== "unknown",
      });
    }
  });

  return {
    instructions: summaries,
    programIds: Array.from(programMap.values()),
  };
}

export async function getTransactionExplorerData(signature, viewerUser) {
  const parsedTransaction = await getParsedTransactionDetails(signature);
  if (!parsedTransaction) {
    throw new AppError("Transaction not found on Solana Devnet", 404);
  }

  const mirror = await TransactionMirror.findOne({ signature }).lean();
  const accountKeys = parsedTransaction.transaction.message.accountKeys || [];
  const signers = accountKeys.filter((account) => account.signer).map((account) => toBase58Value(account.pubkey));
  const involvedAccounts = accountKeys.map((account) => ({
    address: toBase58Value(account.pubkey),
    signer: Boolean(account.signer),
    writable: Boolean(account.writable),
  }));
  const transferSummary = buildTransferSummary(parsedTransaction);
  const { instructions, programIds } = buildProgramSummaries(parsedTransaction);
  const labelMap = await getViewerAddressLabels(
    viewerUser,
    involvedAccounts.map((entry) => entry.address),
  );

  return {
    queryType: "transaction",
    verifiedOnChain: true,
    signature,
    shortSignature: shorten(signature, 10, 8),
    explorerUrl: buildExplorerUrl(signature),
    slot: parsedTransaction.slot,
    blockTime: parsedTransaction.blockTime ? new Date(parsedTransaction.blockTime * 1000).toISOString() : null,
    status: parsedTransaction.meta?.err ? "Failed" : "Confirmed",
    confirmationState: parsedTransaction.meta?.err ? "failed" : "confirmed",
    feeLamports: parsedTransaction.meta?.fee || 0,
    feeSol: Number(((parsedTransaction.meta?.fee || 0) / LAMPORTS_PER_SOL).toFixed(9)),
    signerAddresses: signers.map((address) => ({
      address,
      shortAddress: shorten(address, 6, 5),
      label: labelMap.get(address)?.label || shorten(address, 6, 5),
      explorerUrl: buildExplorerAddressUrl(address),
    })),
    involvedAccounts: involvedAccounts.map((account) => ({
      ...account,
      shortAddress: shorten(account.address, 6, 5),
      label: labelMap.get(account.address)?.label || shorten(account.address, 6, 5),
      explorerUrl: buildExplorerAddressUrl(account.address),
    })),
    instructionCount: instructions.length,
    instructions,
    programIds,
    transferSummary,
    protocolClassification:
      mirror?.protocolModule && mirror.protocolModule !== "unknown"
        ? mirror.protocolModule[0].toUpperCase() + mirror.protocolModule.slice(1)
        : classifyProtocol(programIds, transferSummary),
    rawMeta: {
      computeUnitsConsumed: parsedTransaction.meta?.computeUnitsConsumed || null,
      preBalances: parsedTransaction.meta?.preBalances || [],
      postBalances: parsedTransaction.meta?.postBalances || [],
    },
    mirroredClassification: mirror
      ? {
          type: mirror.type,
          module: mirror.protocolModule,
          tokenSymbol: mirror.tokenSymbol,
          amount: mirror.amount,
        }
      : null,
    source: mirror ? "on-chain+mirror" : "on-chain",
  };
}

export async function getTokenMintExplorerData(mint) {
  const normalizedMint = parsePublicKey(mint).toBase58();
  const connection = getSolanaConnection();
  const mintPublicKey = new PublicKey(normalizedMint);
  const [mintInfo, supply, largestAccounts, tokenModel, tokenAccountEntries] = await Promise.all([
    getMint(connection, mintPublicKey, "confirmed"),
    connection.getTokenSupply(mintPublicKey),
    connection.getTokenLargestAccounts(mintPublicKey).catch(() => ({ value: [] })),
    Token.findOne({ mintAddress: normalizedMint }).lean(),
    connection
      .getProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: normalizedMint } },
        ],
      })
      .catch(() => []),
  ]);

  return {
    queryType: "token",
    verifiedOnChain: true,
    mintAddress: normalizedMint,
    shortMintAddress: shorten(normalizedMint, 6, 5),
    explorerUrl: buildExplorerAddressUrl(normalizedMint),
    symbol: tokenModel?.symbol || null,
    name: tokenModel?.name || null,
    decimals: mintInfo.decimals,
    totalSupply: Number(supply.value.uiAmountString || 0),
    mintAuthority: mintInfo.mintAuthority ? mintInfo.mintAuthority.toBase58() : null,
    freezeAuthority: mintInfo.freezeAuthority ? mintInfo.freezeAuthority.toBase58() : null,
    tokenAccountsCount: tokenAccountEntries.length,
    largestAccounts: (largestAccounts.value || []).slice(0, 5).map((entry) => ({
      address: entry.address.toBase58(),
      shortAddress: shorten(entry.address.toBase58(), 6, 5),
      amount: Number(entry.uiAmountString || 0),
      explorerUrl: buildExplorerAddressUrl(entry.address.toBase58()),
    })),
    knownByApp: Boolean(tokenModel),
    source: tokenModel ? "on-chain+cache" : "on-chain",
  };
}

export async function getBlockExplorerData(slot) {
  const numericSlot = Number(slot);
  const connection = getSolanaConnection();
  const parsedBlock = await connection.getParsedBlock(numericSlot, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
    rewards: false,
    transactionDetails: "full",
  });

  if (!parsedBlock) {
    throw new AppError("Block not found on Solana Devnet", 404);
  }

  const programSummaryMap = new Map();
  let totalFeesLamports = 0;

  for (const entry of parsedBlock.transactions || []) {
    totalFeesLamports += Number(entry.meta?.fee || 0);
    const instructions = entry.transaction.message.instructions || [];
    instructions.forEach((instruction) => {
      const programId = getInstructionProgramId(instruction);
      const descriptor = getProgramDescriptor(programId);
      const existing = programSummaryMap.get(programId) || {
        programId,
        label: descriptor.label,
        protocolModule: descriptor.module,
        count: 0,
      };
      existing.count += 1;
      programSummaryMap.set(programId, existing);
    });
  }

  return {
    queryType: "block",
    verifiedOnChain: true,
    slot: numericSlot,
    blockTime: parsedBlock.blockTime ? new Date(parsedBlock.blockTime * 1000).toISOString() : null,
    blockHeight: parsedBlock.blockHeight || null,
    transactionCount: parsedBlock.transactions?.length || 0,
    totalFeesLamports,
    totalFeesSol: Number((totalFeesLamports / LAMPORTS_PER_SOL).toFixed(9)),
    explorerUrl: buildBlockExplorerUrl(numericSlot),
    keyProgramsUsed: Array.from(programSummaryMap.values()).sort((a, b) => b.count - a.count),
    signatures: (parsedBlock.transactions || []).slice(0, 12).map((entry) => ({
      signature: entry.transaction.signatures?.[0] || "",
      shortSignature: shorten(entry.transaction.signatures?.[0] || "", 10, 8),
      explorerUrl: buildExplorerUrl(entry.transaction.signatures?.[0] || ""),
      feeLamports: Number(entry.meta?.fee || 0),
      status: entry.meta?.err ? "Failed" : "Confirmed",
    })),
    source: "on-chain",
  };
}

export async function getWalletInteractionGraph(address, viewerUser) {
  const walletData = await getWalletExplorerData(address, viewerUser);
  const centerAddress = walletData.walletAddress;

  const nodes = [
    {
      id: centerAddress,
      type: "wallet",
      role: "center",
      address: centerAddress,
      label: walletData.addressLabel || walletData.shortAddress,
      shortLabel: walletData.shortAddress,
      value: walletData.solBalance,
      interactionCount: walletData.recentTransactionCount,
      explorerUrl: walletData.explorerUrl,
      tags: walletData.tags,
    },
    ...walletData.interactedWallets.map((wallet) => ({
      id: wallet.address,
      type: "wallet",
      role: "counterparty",
      address: wallet.address,
      label: wallet.label,
      shortLabel: wallet.shortAddress,
      value: wallet.totalVolume,
      interactionCount: wallet.txCount,
      explorerUrl: wallet.explorerUrl,
      tags: [wallet.tag],
    })),
  ];

  const edges = walletData.interactedWallets.map((wallet) => ({
    id: `${centerAddress}-${wallet.address}`,
    source: centerAddress,
    target: wallet.address,
    txCount: wallet.txCount,
    totalVolume: wallet.totalVolume,
    relation: "interacted-with",
  }));

  return {
    centerAddress,
    nodes,
    edges,
    legends: [
      { label: "Searched Wallet", tone: "center" },
      { label: "Counterparty", tone: "counterparty" },
      { label: "High Frequency Path", tone: "active-edge" },
    ],
    source: "on-chain+mirror",
  };
}

export async function getTransactionFlowData(signature, viewerUser) {
  const transaction = await getTransactionExplorerData(signature, viewerUser);
  const primaryTransfer = transaction.transferSummary[0] || null;
  const primarySigner = transaction.signerAddresses[0] || null;
  const mainProgram = transaction.programIds[0] || null;
  const destination =
    transaction.transferSummary.find((entry) => entry.destination)?.destination ||
    transaction.involvedAccounts.find((entry) => !entry.signer)?.address ||
    null;

  const nodes = [
    primarySigner
      ? {
          id: primarySigner.address,
          type: "wallet",
          label: primarySigner.label,
          subtitle: "Signer",
          explorerUrl: primarySigner.explorerUrl,
        }
      : null,
    mainProgram
      ? {
          id: mainProgram.programId,
          type: "program",
          label: mainProgram.label,
          subtitle: mainProgram.badge,
          explorerUrl: buildExplorerAddressUrl(mainProgram.programId),
        }
      : null,
    destination
      ? {
          id: destination,
          type: primaryTransfer?.mint ? "token-account" : "wallet",
          label: shorten(destination, 6, 5),
          subtitle: "Destination",
          explorerUrl: buildExplorerAddressUrl(destination),
        }
      : null,
    {
      id: signature,
      type: "signature",
      label: shorten(signature, 8, 8),
      subtitle: transaction.status,
      explorerUrl: transaction.explorerUrl,
    },
  ].filter(Boolean);

  const steps = [];

  if (primarySigner && mainProgram) {
    steps.push({
      id: `${primarySigner.address}-${mainProgram.programId}`,
      from: primarySigner.address,
      to: mainProgram.programId,
      label: "Signed and submitted",
      value: null,
      status: "confirmed",
    });
  }

  if (mainProgram && destination) {
    steps.push({
      id: `${mainProgram.programId}-${destination}`,
      from: mainProgram.programId,
      to: destination,
      label:
        primaryTransfer?.kind === "sol-transfer"
          ? "SOL transfer"
          : primaryTransfer?.kind === "token-mint"
            ? "Mint action"
            : primaryTransfer?.kind === "token-transfer"
              ? "Token transfer"
              : "Program interaction",
      value: primaryTransfer
        ? `${primaryTransfer.amount} ${primaryTransfer.symbol || "SOL"}`
        : `${transaction.instructionCount} instructions`,
      status: transaction.status.toLowerCase(),
    });
  }

  if (destination) {
    steps.push({
      id: `${destination}-${signature}`,
      from: destination,
      to: signature,
      label: "Finalized on-chain",
      value: `${transaction.feeSol} SOL fee`,
      status: transaction.status.toLowerCase(),
    });
  }

  return {
    signature: transaction.signature,
    shortSignature: transaction.shortSignature,
    status: transaction.status,
    confirmationState: transaction.confirmationState,
    protocolClassification: transaction.protocolClassification,
    feeSol: transaction.feeSol,
    feeLamports: transaction.feeLamports,
    blockTime: transaction.blockTime,
    explorerUrl: transaction.explorerUrl,
    nodes,
    steps,
    transferSummary: transaction.transferSummary,
    source: transaction.source,
  };
}
