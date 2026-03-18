import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

import { env } from "../config/env.js";
import { decryptSecret, encryptSecret } from "../utils/crypto.js";
import { AppError } from "../utils/app-error.js";

const connection = new Connection(env.solanaRpcUrl, "confirmed");

function parseSecretKey(secret) {
  const trimmed = secret.trim();

  if (trimmed.startsWith("[")) {
    return Uint8Array.from(JSON.parse(trimmed));
  }

  if (trimmed.includes(",")) {
    return Uint8Array.from(
      trimmed
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value)),
    );
  }

  throw new AppError("Unsupported private key format", 400);
}

export function getSolanaConnection() {
  return connection;
}

export function parsePublicKey(address, message = "Invalid wallet address") {
  try {
    return new PublicKey(address);
  } catch {
    throw new AppError(message, 400);
  }
}

export function buildExplorerUrl(signature) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function buildExplorerAddressUrl(address) {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function serializeSecretKey(secretKey) {
  return JSON.stringify(Array.from(secretKey));
}

export function generateWalletSecret() {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: serializeSecretKey(keypair.secretKey),
    encryptedPrivateKey: encryptSecret(serializeSecretKey(keypair.secretKey)),
  };
}

export function encryptWalletSecret(privateKey) {
  return encryptSecret(privateKey);
}

export function getKeypairFromEncryptedSecret(encryptedPrivateKey) {
  const decrypted = decryptSecret(encryptedPrivateKey);
  return Keypair.fromSecretKey(parseSecretKey(decrypted));
}

export function getPublicKeyFromPrivateKey(privateKey) {
  return Keypair.fromSecretKey(parseSecretKey(privateKey)).publicKey.toBase58();
}

export async function getBalance(address) {
  const publicKey = parsePublicKey(address);
  const lamports = await connection.getBalance(publicKey);
  return {
    lamports,
    sol: Number((lamports / LAMPORTS_PER_SOL).toFixed(6)),
  };
}

export async function getParsedTokenAccounts(address) {
  const publicKey = parsePublicKey(address);
  const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  return response.value.map((entry) => ({
    mint: entry.account.data.parsed.info.mint,
    amount: Number(entry.account.data.parsed.info.tokenAmount.uiAmount || 0),
    decimals: Number(entry.account.data.parsed.info.tokenAmount.decimals || 0),
  }));
}

export async function getTokenAccounts(address) {
  return getParsedTokenAccounts(address);
}

export async function getTransactions(address, limit = 20) {
  const publicKey = parsePublicKey(address);
  return connection.getSignaturesForAddress(publicKey, { limit });
}

export async function getParsedTransactionDetails(signature) {
  return connection.getParsedTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
}

export async function estimateTransactionFee({
  fromAddress,
  toAddress,
  amountSol = 0.0001,
} = {}) {
  const sender = fromAddress ? parsePublicKey(fromAddress) : Keypair.generate().publicKey;
  const receiver = toAddress ? parsePublicKey(toAddress) : Keypair.generate().publicKey;
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: sender,
    recentBlockhash: latestBlockhash.blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: receiver,
      lamports: Math.max(1, Math.round(amountSol * LAMPORTS_PER_SOL)),
    }),
  );

  const fee = await connection.getFeeForMessage(transaction.compileMessage(), "confirmed");
  return Number((((fee.value || 5000) / LAMPORTS_PER_SOL)).toFixed(6));
}

export async function getRpcLatency() {
  const startedAt = Date.now();
  await connection.getLatestBlockhash("confirmed");
  return Date.now() - startedAt;
}

export async function getSignatureStatus(signature) {
  const response = await connection.getSignatureStatuses([signature]);
  const status = response.value?.[0];
  return {
    status: status?.err ? "failed" : "confirmed",
    raw: status,
  };
}

export async function requestAirdrop(address, amountSol = 1) {
  const publicKey = parsePublicKey(address);
  const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
  const signature = await connection.requestAirdrop(publicKey, lamports);
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );

  return {
    signature,
    amount: Number((lamports / LAMPORTS_PER_SOL).toFixed(6)),
  };
}

export async function sendSol({ encryptedPrivateKey, receiverAddress, amount }) {
  const sender = getKeypairFromEncryptedSecret(encryptedPrivateKey);
  const receiver = parsePublicKey(receiverAddress, "Invalid receiver address");
  const lamports = Math.round(amount * LAMPORTS_PER_SOL);
  const balance = await connection.getBalance(sender.publicKey);

  if (balance < lamports) {
    throw new AppError("Insufficient SOL balance for this transfer", 400);
  }

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: sender.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: receiver,
      lamports,
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [sender], {
    commitment: "confirmed",
  });

  return {
    signature,
    senderAddress: sender.publicKey.toBase58(),
    receiverAddress,
    amount,
  };
}

export async function createSplToken({
  encryptedPrivateKey,
  name,
  symbol,
  decimals,
  initialSupply,
}) {
  const owner = getKeypairFromEncryptedSecret(encryptedPrivateKey);
  const mint = await createMint(connection, owner, owner.publicKey, owner.publicKey, decimals);
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    owner.publicKey,
  );
  const supply = BigInt(Math.floor(initialSupply * 10 ** decimals));
  const transactionSignature = await mintTo(
    connection,
    owner,
    mint,
    tokenAccount.address,
    owner,
    supply,
  );

  return {
    name,
    symbol,
    mintAddress: mint.toBase58(),
    tokenAccountAddress: tokenAccount.address.toBase58(),
    transactionSignature,
  };
}

export async function createSPLToken(payload) {
  return createSplToken(payload);
}
