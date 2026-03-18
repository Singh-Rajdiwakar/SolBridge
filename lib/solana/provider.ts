import type { Connection, SendOptions, Transaction } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Idl, Wallet } from "@coral-xyz/anchor";

import { DEFAULT_COMMITMENT, getReadonlyConnection } from "@/lib/solana/connection";
import type { AnchorWalletLike } from "@/lib/solana/wallet";
import { isAnchorWalletLike } from "@/lib/solana/wallet";

export { DEFAULT_COMMITMENT, getReadonlyConnection };

export function canUseAnchorWallet(wallet?: Partial<AnchorWalletLike> | null) {
  return isAnchorWalletLike(wallet);
}

export function getAnchorProvider(
  connection: Connection,
  wallet: AnchorWalletLike,
  opts?: { commitment?: typeof DEFAULT_COMMITMENT; preflightCommitment?: typeof DEFAULT_COMMITMENT },
) {
  return new AnchorProvider(connection, wallet as unknown as Wallet, {
    commitment: opts?.commitment || DEFAULT_COMMITMENT,
    preflightCommitment: opts?.preflightCommitment || DEFAULT_COMMITMENT,
  });
}

export function createAnchorProvider(
  connection: Connection,
  wallet: AnchorWalletLike,
  opts?: { commitment?: typeof DEFAULT_COMMITMENT; preflightCommitment?: typeof DEFAULT_COMMITMENT },
) {
  return getAnchorProvider(connection, wallet, opts);
}

export function createProgramClient(connection: Connection, wallet: AnchorWalletLike, idl: Idl) {
  const provider = getAnchorProvider(connection, wallet);
  return new Program(idl, provider);
}

export function createProgramFromProvider<I extends Idl>(idl: I, provider: AnchorProvider) {
  return new Program(idl, provider);
}

export async function sendPreparedTransaction(
  connection: Connection,
  wallet: AnchorWalletLike,
  transaction: Transaction,
  options?: SendOptions,
) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Anchor wallet is not ready for signing.");
  }

  const latestBlockhash = await connection.getLatestBlockhash(DEFAULT_COMMITMENT);
  transaction.feePayer = transaction.feePayer || wallet.publicKey;
  transaction.recentBlockhash = transaction.recentBlockhash || latestBlockhash.blockhash;
  const signed = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), options);

  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    DEFAULT_COMMITMENT,
  );

  return signature;
}
