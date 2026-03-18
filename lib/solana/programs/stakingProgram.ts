import type { AnchorProvider, Idl } from "@coral-xyz/anchor";

import stakingIdl from "@/lib/solana/idl/staking_program.json";
import { createAnchorProgram } from "@/lib/solana/programs/shared";

export type StakingProgramIdl = typeof stakingIdl;

export function getStakingProgram(provider?: AnchorProvider) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAnchorProgram(stakingIdl as Idl, provider) as any;
}

export { stakingIdl };
