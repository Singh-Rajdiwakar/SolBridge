import type { Connection, PublicKeyInitData } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";

import { buildExplorerAddressUrl, buildExplorerUrl } from "@/lib/solana";
import { getReadonlyConnection, getAnchorProvider } from "@/lib/solana/provider";
import type { AnchorWalletLike } from "@/lib/solana/wallet";
import { normalizeSolanaError } from "@/lib/solana/errors";
import type { OnChainActionResult, OnChainProgramStatus } from "@/types";

export async function checkAccountExists(address?: string | null) {
  if (!address) {
    return false;
  }

  try {
    const connection = getReadonlyConnection();
    const account = await connection.getAccountInfo(new PublicKey(address));
    return Boolean(account);
  } catch {
    return false;
  }
}

export async function buildProgramStatus(params: {
  module: OnChainProgramStatus["module"];
  label: string;
  programId: PublicKey;
  configAddress?: string | null;
  notes?: string[];
}) {
  const deployed = await checkAccountExists(params.configAddress || params.programId.toBase58());
  return {
    module: params.module,
    label: params.label,
    programId: params.programId.toBase58(),
    explorerUrl: buildExplorerAddressUrl(params.programId.toBase58()),
    configAddress: params.configAddress || undefined,
    configExplorerUrl: params.configAddress ? buildExplorerAddressUrl(params.configAddress) : undefined,
    deployed,
    source: deployed ? "on-chain" : "fallback",
    notes: params.notes,
  } satisfies OnChainProgramStatus;
}

export function buildFallbackActionResult(label: string, message: string): OnChainActionResult {
  return {
    label,
    status: "fallback",
    source: "rest",
    message,
  };
}

export function buildConfirmedActionResult(label: string, signature: string): OnChainActionResult {
  return {
    label,
    status: "confirmed",
    source: "on-chain",
    message: "Transaction confirmed on Solana Devnet.",
    signature,
    explorerUrl: buildExplorerUrl(signature),
  };
}

export function requireDeployment(status: OnChainProgramStatus, missingMessage: string) {
  if (!status.deployed || !status.configAddress) {
    throw new Error(missingMessage);
  }
}

export type ProgramActionContext = {
  connection: Connection;
  publicKey: PublicKey;
  anchorWallet: AnchorWalletLike | null;
  address?: string | null;
  providerName?: string | null;
};

export function requireProgramContext(
  context?: ProgramActionContext,
): ProgramActionContext & { anchorWallet: AnchorWalletLike } {
  if (!context?.publicKey || !context.anchorWallet) {
    throw new Error("Connect a signing wallet first.");
  }

  return context as ProgramActionContext & { anchorWallet: AnchorWalletLike };
}

export function createProgramProvider(context: ProgramActionContext) {
  const safeContext = requireProgramContext(context);
  return getAnchorProvider(safeContext.connection, safeContext.anchorWallet);
}

export function toPublicKey(value?: string | PublicKey | null) {
  if (!value) {
    return null;
  }

  return value instanceof PublicKey ? value : new PublicKey(value);
}

export function toPublicKeyString(value?: PublicKeyInitData | { toBase58: () => string } | null) {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "toBase58" in value) {
    return value.toBase58();
  }

  return new PublicKey(value).toBase58();
}

export function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (value && typeof value === "object") {
    if ("toNumber" in value && typeof value.toNumber === "function") {
      return value.toNumber();
    }
    if ("toString" in value && typeof value.toString === "function") {
      const parsed = Number(value.toString());
      return Number.isFinite(parsed) ? parsed : fallback;
    }
  }

  return fallback;
}

export function toBaseUnits(amount: number, decimals = 0) {
  if (!Number.isFinite(amount)) {
    return BigInt(0);
  }

  const [whole = "0", fraction = ""] = amount.toString().split(".");
  const normalizedFraction = `${fraction}${"0".repeat(decimals)}`.slice(0, decimals);
  return BigInt(`${whole}${normalizedFraction}` || "0");
}

export function fromBaseUnits(amount: number | bigint, decimals = 0) {
  const numeric = typeof amount === "bigint" ? Number(amount) : amount;
  if (!decimals) {
    return numeric;
  }
  return numeric / 10 ** decimals;
}

export function parseEnumVariant(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const [firstKey] = Object.keys(value as Record<string, unknown>);
    return firstKey || "unknown";
  }

  return "unknown";
}

export function normalizeActionError(error: unknown) {
  return new Error(normalizeSolanaError(error));
}

export async function findOwnedTokenAccount(connection: Connection, owner: PublicKey, mint: PublicKey) {
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint }, "confirmed");
  return accounts.value[0]?.pubkey || null;
}

export async function getAtaWithOptionalCreateInstruction(
  connection: Connection,
  payer: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
) {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const existing = await connection.getAccountInfo(ata, "confirmed");
  return {
    address: ata,
    createInstruction: existing
      ? null
      : createAssociatedTokenAccountInstruction(payer, ata, owner, mint),
  };
}

export async function getMintDecimals(connection: Connection, mint: PublicKey) {
  const mintAccount = await getMint(connection, mint, "confirmed");
  return mintAccount.decimals;
}
