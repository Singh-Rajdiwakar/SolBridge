export { DEFAULT_SOL_FEE, SOLANA_NETWORK, SOLANA_RPC_ENDPOINT } from "@/lib/solana/connection";
export {
  getAddressExplorerUrl as buildExplorerAddressUrl,
  getTokenExplorerUrl,
  getTxExplorerUrl as buildExplorerUrl,
} from "@/lib/solana/explorer";

export function shortenAddress(address?: string | null) {
  if (!address) {
    return "--";
  }

  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
