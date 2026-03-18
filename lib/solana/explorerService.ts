import { PublicKey } from "@solana/web3.js";

import { explorerApi } from "@/services/api";
import type {
  ExplorerBlockResult,
  ExplorerSearchType,
  ExplorerTokenResult,
  ExplorerTransactionResult,
  ExplorerWalletResult,
} from "@/types";

const BASE58_SIGNATURE_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;
const RECENT_SEARCHES_KEY = "retix-explorer-recent-searches";

export type ExplorerSearchResult =
  | ExplorerWalletResult
  | ExplorerTransactionResult
  | ExplorerTokenResult
  | ExplorerBlockResult;

export function getExplorerSearchPlaceholder(type: ExplorerSearchType) {
  switch (type) {
    case "wallet":
      return "Search wallet address";
    case "transaction":
      return "Search transaction signature";
    case "token":
      return "Search token mint address";
    case "block":
      return "Search slot / block number";
    default:
      return "Search on-chain entity";
  }
}

export function validateExplorerQuery(type: ExplorerSearchType, query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return "Enter a search value first.";
  }

  if (type === "block") {
    return /^\d+$/.test(trimmed) ? null : "Slot must be a numeric value.";
  }

  if (type === "transaction") {
    if (trimmed.length < 32 || trimmed.length > 128 || !BASE58_SIGNATURE_REGEX.test(trimmed)) {
      return "Enter a valid Solana transaction signature.";
    }
    return null;
  }

  try {
    new PublicKey(trimmed);
    return null;
  } catch {
    return type === "token"
      ? "Enter a valid Solana token mint address."
      : "Enter a valid Solana wallet address.";
  }
}

export async function runExplorerSearch(type: ExplorerSearchType, query: string) {
  const trimmed = query.trim();
  switch (type) {
    case "wallet":
      return explorerApi.wallet(trimmed);
    case "transaction":
      return explorerApi.transaction(trimmed);
    case "token":
      return explorerApi.token(trimmed);
    case "block":
      return explorerApi.block(trimmed);
    default:
      throw new Error("Unsupported explorer search type.");
  }
}

export type ExplorerRecentSearch = {
  type: ExplorerSearchType;
  value: string;
  savedAt: string;
};

export function getRecentExplorerSearches(): ExplorerRecentSearch[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as ExplorerRecentSearch[]) : [];
  } catch {
    return [];
  }
}

export function saveRecentExplorerSearch(entry: ExplorerRecentSearch) {
  if (typeof window === "undefined") {
    return [];
  }

  const next = [
    entry,
    ...getRecentExplorerSearches().filter(
      (item) => !(item.type === entry.type && item.value === entry.value),
    ),
  ].slice(0, 8);

  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}
