import type { AnchorProvider, Idl } from "@coral-xyz/anchor";

import lendingIdl from "@/lib/solana/idl/lending_program.json";
import { createAnchorProgram } from "@/lib/solana/programs/shared";

export type LendingProgramIdl = typeof lendingIdl;

export function getLendingProgram(provider?: AnchorProvider) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAnchorProgram(lendingIdl as Idl, provider) as any;
}

export { lendingIdl };
