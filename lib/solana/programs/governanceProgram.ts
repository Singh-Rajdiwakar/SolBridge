import type { AnchorProvider, Idl } from "@coral-xyz/anchor";

import governanceIdl from "@/lib/solana/idl/governance_program.json";
import { createAnchorProgram } from "@/lib/solana/programs/shared";

export type GovernanceProgramIdl = typeof governanceIdl;

export function getGovernanceProgram(provider?: AnchorProvider) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAnchorProgram(governanceIdl as Idl, provider) as any;
}

export { governanceIdl };
