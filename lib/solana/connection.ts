import { clusterApiUrl, Connection } from "@solana/web3.js";
import type { Commitment } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork | undefined) || WalletAdapterNetwork.Devnet;
export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK);
export const DEFAULT_COMMITMENT = "confirmed" as const;
export const DEFAULT_SOL_FEE = 0.000005;

export function getReadonlyConnection(commitment: Commitment = DEFAULT_COMMITMENT) {
  return new Connection(SOLANA_RPC_ENDPOINT, commitment);
}
