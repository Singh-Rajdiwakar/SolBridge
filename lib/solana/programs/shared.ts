import { Keypair } from "@solana/web3.js";
import type { Idl, Program, Wallet } from "@coral-xyz/anchor";
import { AnchorProvider, Program as AnchorProgram } from "@coral-xyz/anchor";

import { getReadonlyConnection, DEFAULT_COMMITMENT } from "@/lib/solana/connection";
import { createReadonlyWallet } from "@/lib/solana/wallet";

export function createReadonlyAnchorProvider() {
  const connection = getReadonlyConnection(DEFAULT_COMMITMENT);
  const wallet = createReadonlyWallet(Keypair.generate().publicKey);
  return new AnchorProvider(connection, wallet as unknown as Wallet, {
    commitment: DEFAULT_COMMITMENT,
    preflightCommitment: DEFAULT_COMMITMENT,
  });
}

export function createAnchorProgram<I extends Idl>(idl: I, provider?: AnchorProvider) {
  return new AnchorProgram(idl, provider || createReadonlyAnchorProvider()) as Program<I>;
}
