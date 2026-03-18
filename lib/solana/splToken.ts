import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction, createTransferInstruction, getAssociatedTokenAddressSync, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export function getAssociatedTokenAddress(owner: PublicKey, mint: PublicKey) {
  return getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID);
}

export function buildCreateMintTransaction(params: {
  payer: PublicKey;
  mintKeypair: Keypair;
  mintAuthority: PublicKey;
  decimals: number;
  rentLamports: number;
}) {
  const transaction = new Transaction();
  transaction.add(
    // The system account creation step is expected to be added by the caller.
    createInitializeMintInstruction(
      params.mintKeypair.publicKey,
      params.decimals,
      params.mintAuthority,
      params.mintAuthority,
      TOKEN_PROGRAM_ID,
    ),
  );
  return {
    transaction,
    space: MINT_SIZE,
    mintAddress: params.mintKeypair.publicKey,
    rentLamports: params.rentLamports,
  };
}

export function buildMintToTransaction(params: {
  mint: PublicKey;
  destination: PublicKey;
  authority: PublicKey;
  amount: bigint;
}) {
  return new Transaction().add(
    createMintToInstruction(params.mint, params.destination, params.authority, params.amount),
  );
}

export function buildAtaCreationInstruction(payer: PublicKey, ata: PublicKey, owner: PublicKey, mint: PublicKey) {
  return createAssociatedTokenAccountInstruction(payer, ata, owner, mint);
}

export function buildTransferSplTokenTransaction(params: {
  source: PublicKey;
  destination: PublicKey;
  owner: PublicKey;
  amount: bigint;
}) {
  return new Transaction().add(
    createTransferInstruction(params.source, params.destination, params.owner, params.amount),
  );
}
