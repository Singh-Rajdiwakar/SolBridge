import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";

import {
  GOVERNANCE_PROGRAM_ID,
  LENDING_PROGRAM_ID,
  LIQUIDITY_PROGRAM_ID,
  STAKING_PROGRAM_ID,
} from "@/lib/solana/programIds";

function u64Seed(value: bigint | number) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value));
  return buffer;
}

export function getStakingConfigPda() {
  return PublicKey.findProgramAddressSync([Buffer.from("staking-config")], STAKING_PROGRAM_ID);
}

export function getLockPeriodPda(durationDays: bigint | number) {
  return PublicKey.findProgramAddressSync([Buffer.from("lock-period"), u64Seed(durationDays)], STAKING_PROGRAM_ID);
}

export function getStakePositionPda(owner: PublicKey, positionNonce: bigint | number) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake-position"), owner.toBuffer(), u64Seed(positionNonce)],
    STAKING_PROGRAM_ID,
  );
}

export function getGovernanceConfigPda() {
  return PublicKey.findProgramAddressSync([Buffer.from("governance-config")], GOVERNANCE_PROGRAM_ID);
}

export function getProposalPda(proposalId: bigint | number) {
  return PublicKey.findProgramAddressSync([Buffer.from("proposal"), u64Seed(proposalId)], GOVERNANCE_PROGRAM_ID);
}

export function getVoteRecordPda(proposal: PublicKey, voter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vote-record"), proposal.toBuffer(), voter.toBuffer()],
    GOVERNANCE_PROGRAM_ID,
  );
}

export function getPoolPda(tokenAMint: PublicKey, tokenBMint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), tokenAMint.toBuffer(), tokenBMint.toBuffer()],
    LIQUIDITY_PROGRAM_ID,
  );
}

export function getLiquidityPositionPda(pool: PublicKey, owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), pool.toBuffer(), owner.toBuffer()],
    LIQUIDITY_PROGRAM_ID,
  );
}

export function getLendingMarketPda(collateralMint: PublicKey, borrowMint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), collateralMint.toBuffer(), borrowMint.toBuffer()],
    LENDING_PROGRAM_ID,
  );
}

export function getLendingPositionPda(market: PublicKey, owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("lending-position"), market.toBuffer(), owner.toBuffer()],
    LENDING_PROGRAM_ID,
  );
}
