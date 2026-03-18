import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

import { buildAtaCreationInstruction, buildCreateMintTransaction, buildMintToTransaction, buildTransferSplTokenTransaction, getAssociatedTokenAddress } from "@/lib/solana/splToken";
import { getReadonlyConnection } from "@/lib/solana/provider";

export async function createTokenMint(params: {
  payer: PublicKey;
  mintAuthority: PublicKey;
  decimals: number;
}) {
  const connection = getReadonlyConnection();
  const mintKeypair = Keypair.generate();
  const rentLamports = await connection.getMinimumBalanceForRentExemption(82);
  return buildCreateMintTransaction({
    payer: params.payer,
    mintKeypair,
    mintAuthority: params.mintAuthority,
    decimals: params.decimals,
    rentLamports,
  });
}

export function mintTokens(params: {
  mint: PublicKey;
  destination: PublicKey;
  authority: PublicKey;
  amount: bigint;
}) {
  return buildMintToTransaction(params);
}

export function transferSplToken(params: {
  source: PublicKey;
  destination: PublicKey;
  owner: PublicKey;
  amount: bigint;
}) {
  return buildTransferSplTokenTransaction(params);
}

export async function fetchTokenAccounts(owner: PublicKey) {
  const connection = getReadonlyConnection();
  return connection.getParsedTokenAccountsByOwner(owner, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });
}

export function buildCreateAssociatedTokenAccountTransaction(payer: PublicKey, owner: PublicKey, mint: PublicKey) {
  const ata = getAssociatedTokenAddress(owner, mint);
  return {
    ata,
    transaction: new Transaction().add(buildAtaCreationInstruction(payer, ata, owner, mint)),
  };
}
