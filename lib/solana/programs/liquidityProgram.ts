import type { AnchorProvider, Idl } from "@coral-xyz/anchor";

import liquidityIdl from "@/lib/solana/idl/liquidity_program.json";
import { createAnchorProgram } from "@/lib/solana/programs/shared";

export type LiquidityProgramIdl = typeof liquidityIdl;

export function getLiquidityProgram(provider?: AnchorProvider) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAnchorProgram(liquidityIdl as Idl, provider) as any;
}

export { liquidityIdl };
