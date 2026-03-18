const SOLANA_EXPLORER_BASE = "https://explorer.solana.com";
const SOLANA_CLUSTER_QUERY = "?cluster=devnet";

export function getTxExplorerUrl(signature: string) {
  return `${SOLANA_EXPLORER_BASE}/tx/${signature}${SOLANA_CLUSTER_QUERY}`;
}

export function getAddressExplorerUrl(address: string) {
  return `${SOLANA_EXPLORER_BASE}/address/${address}${SOLANA_CLUSTER_QUERY}`;
}

export function getTokenExplorerUrl(mint: string) {
  return `${SOLANA_EXPLORER_BASE}/address/${mint}${SOLANA_CLUSTER_QUERY}`;
}

export function getBlockExplorerUrl(slot: number | string) {
  return `${SOLANA_EXPLORER_BASE}/block/${slot}${SOLANA_CLUSTER_QUERY}`;
}
