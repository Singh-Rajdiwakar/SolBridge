import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { DEFAULT_SOL_FEE, SOLANA_RPC_ENDPOINT } from "@/lib/solana";
import { walletApi } from "@/services/api";

const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");

export async function getBalance(address: string, provider?: string) {
  const publicKey = new PublicKey(address);
  const lamports = await connection.getBalance(publicKey);
  const balanceSol = Number((lamports / LAMPORTS_PER_SOL).toFixed(6));

  return {
    address,
    walletAddress: address,
    balanceSol,
    solBalance: balanceSol,
    usdEstimate: Number((balanceSol * 152.4).toFixed(2)),
    usdValue: Number((balanceSol * 152.4).toFixed(2)),
    network: "Devnet",
    provider: provider || "Solana RPC",
    status: "Connected",
    tokens: [],
  };
}

export async function sendSol(payload: {
  address: string;
  receiver: string;
  amount: number;
  signature: string;
  provider?: string;
  note?: string;
}) {
  return walletApi.send(payload);
}

export async function requestAirdrop(payload: { address: string; amount?: number }) {
  return walletApi.airdrop(payload);
}

export async function createSPLToken(payload: {
  address: string;
  mintAddress: string;
  signature: string;
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  provider?: string;
}) {
  return walletApi.createToken(payload);
}

export async function getTokenAccounts(address: string, provider?: string) {
  return getTokenAccountsOnChain(address);
}

export async function getTransactions(address?: string, page = 1, limit = 20) {
  if (!address) {
    return [];
  }

  return getChainTransactions(address, limit);
}

export async function estimateTransactionFee({
  fromAddress,
  toAddress,
  amountSol = 0.0001,
}: {
  fromAddress?: string;
  toAddress?: string;
  amountSol?: number;
} = {}) {
  try {
    const sender = fromAddress ? new PublicKey(fromAddress) : Keypair.generate().publicKey;
    const receiver = toAddress ? new PublicKey(toAddress) : Keypair.generate().publicKey;
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const transaction = new Transaction({
      feePayer: sender,
      recentBlockhash: blockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: receiver,
        lamports: Math.max(1, Math.round(amountSol * LAMPORTS_PER_SOL)),
      }),
    );

    const fee = await connection.getFeeForMessage(transaction.compileMessage(), "confirmed");
    return Number(((fee.value || Math.round(DEFAULT_SOL_FEE * LAMPORTS_PER_SOL)) / LAMPORTS_PER_SOL).toFixed(6));
  } catch {
    return DEFAULT_SOL_FEE;
  }
}

export async function getTokenAccountsOnChain(address: string) {
  const owner = new PublicKey(address);
  const response = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  return response.value.map((entry) => ({
    mint: entry.account.data.parsed.info.mint,
    amount: Number(entry.account.data.parsed.info.tokenAmount.uiAmount || 0),
    decimals: Number(entry.account.data.parsed.info.tokenAmount.decimals || 0),
  }));
}

export async function getChainTransactions(address: string, limit = 10) {
  const publicKey = new PublicKey(address);
  return connection.getSignaturesForAddress(publicKey, { limit });
}

export async function getNetworkStatus() {
  const startedAt = Date.now();
  const [blockHeight, slot, version] = await Promise.all([
    connection.getBlockHeight("confirmed"),
    connection.getSlot("confirmed"),
    connection.getVersion(),
  ]);
  const latencyMs = Date.now() - startedAt;

  return {
    rpcStatus: "Healthy",
    blockHeight,
    slot,
    latencyMs,
    version: version["solana-core"],
    network: "Solana Devnet",
  };
}

export async function decodeTransactionSignature(signature: string) {
  const parsed = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (!parsed) {
    return null;
  }

  return {
    slot: parsed.slot,
    blockTime: parsed.blockTime,
    feeLamports: parsed.meta?.fee || 0,
    status: parsed.meta?.err ? "Failed" : "Confirmed",
    signerCount: parsed.transaction.message.accountKeys.filter((account) => account.signer).length,
    instructions: parsed.transaction.message.instructions.length,
  };
}

export function getSolanaConnection() {
  return connection;
}
