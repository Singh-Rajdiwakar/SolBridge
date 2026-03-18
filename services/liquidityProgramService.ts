import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";

import { getLiquidityProgram } from "@/lib/solana/programs/liquidityProgram";
import { getLiquidityPositionPda, getPoolPda } from "@/lib/solana/pda";
import type {
  OnChainActionResult,
  OnChainLiquidityPoolSummary,
  OnChainLiquidityPositionSummary,
  OnChainProgramStatus,
} from "@/types";
import {
  buildConfirmedActionResult,
  buildProgramStatus,
  createProgramProvider,
  findOwnedTokenAccount,
  fromBaseUnits,
  getAtaWithOptionalCreateInstruction,
  getMintDecimals,
  normalizeActionError,
  ProgramActionContext,
  requireProgramContext,
  toBaseUnits,
  toNumber,
  toPublicKey,
  toPublicKeyString,
} from "@/services/programs/shared";
import { buildExplorerAddressUrl } from "@/lib/solana";

function formatMintLabel(mint: string) {
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

type PoolsResponse = { program: OnChainProgramStatus; pools: OnChainLiquidityPoolSummary[] };

async function getReadonlyPoolState(): Promise<PoolsResponse & { rawPools: Array<{ publicKey: PublicKey; account: Record<string, unknown> }> }> {
  const program = getLiquidityProgram();
  const rawPools = await program.account.poolState.all().catch(() => []);
  const primaryPool = rawPools[0]?.publicKey.toBase58();
  const programStatus = await buildProgramStatus({
    module: "liquidity",
    label: "Liquidity Program",
    programId: program.programId,
    configAddress: primaryPool,
    notes: [
      "Pool reserves, LP supply, and AMM fee settings are fetched from Solana PDAs.",
      "Liquidity add/remove and swaps require wallet-signed Anchor instructions.",
    ],
  });

  const pools = await Promise.all(
    rawPools.map(async (entry: { publicKey: PublicKey; account: Record<string, unknown> }) => {
      const account = entry.account as Record<string, unknown>;
      const tokenAMint = toPublicKeyString(account.tokenAMint)!;
      const tokenBMint = toPublicKeyString(account.tokenBMint)!;
      const lpMint = toPublicKeyString(account.lpMint)!;
      const [decimalsA, decimalsB, lpDecimals] = await Promise.all([
        getMintDecimals(program.provider.connection, new PublicKey(tokenAMint)),
        getMintDecimals(program.provider.connection, new PublicKey(tokenBMint)),
        getMintDecimals(program.provider.connection, new PublicKey(lpMint)),
      ]);

      const reserveABalance = await program.provider.connection.getTokenAccountBalance(new PublicKey(toPublicKeyString(account.reserveAVault)!));
      const reserveBBalance = await program.provider.connection.getTokenAccountBalance(new PublicKey(toPublicKeyString(account.reserveBVault)!));

      return {
        address: entry.publicKey.toBase58(),
        explorerUrl: buildExplorerAddressUrl(entry.publicKey.toBase58()),
        admin: toPublicKeyString(account.admin),
        tokenA: formatMintLabel(tokenAMint),
        tokenB: formatMintLabel(tokenBMint),
        reserveA: fromBaseUnits(Number(reserveABalance.value.amount), decimalsA),
        reserveB: fromBaseUnits(Number(reserveBBalance.value.amount), decimalsB),
        lpMint,
        feeRateBps: toNumber(account.feeRateBps),
        totalLiquidity: fromBaseUnits(toNumber(account.totalLiquidity), lpDecimals),
        paused: Boolean(account.paused),
        source: "on-chain" as const,
      };
    }),
  );

  return { program: programStatus, pools, rawPools };
}

export async function fetchPools(): Promise<PoolsResponse> {
  const { program, pools } = await getReadonlyPoolState();
  return { program, pools };
}

export async function fetchPool(poolPda: string) {
  return fetchPoolDetails(poolPda);
}

export async function fetchPoolDetails(poolPda: string) {
  const { pools } = await getReadonlyPoolState();
  return pools.find((pool) => pool.address === poolPda) || null;
}

export async function fetchUserLiquidityPositions(walletAddress?: string | null): Promise<OnChainLiquidityPositionSummary[]> {
  if (!walletAddress) {
    return [];
  }

  const owner = new PublicKey(walletAddress);
  const program = getLiquidityProgram();
  const positions = await program.account.userLiquidityPosition.all().catch(() => []);
  return positions
    .filter(
      (entry: { publicKey: PublicKey; account: Record<string, unknown> }) =>
        toPublicKeyString(entry.account.owner) === owner.toBase58(),
    )
    .map((entry: { publicKey: PublicKey; account: Record<string, unknown> }) => {
      const account = entry.account as Record<string, unknown>;
      return {
        address: entry.publicKey.toBase58(),
        poolAddress: toPublicKeyString(account.pool)!,
        explorerUrl: buildExplorerAddressUrl(entry.publicKey.toBase58()),
        lpAmount: toNumber(account.lpTokenAmount),
        depositedA: toNumber(account.depositedTokenAAmount),
        depositedB: toNumber(account.depositedTokenBAmount),
        source: "on-chain",
      };
    });
}

async function getPoolAccountsForWrite(poolAddress: string, context: ProgramActionContext) {
  const provider = createProgramProvider(context);
  const program = getLiquidityProgram(provider);
  const poolPublicKey = new PublicKey(poolAddress);
  const pool = await program.account.poolState.fetch(poolPublicKey);
  return { program, poolPublicKey, pool };
}

export async function addLiquidity(
  payload: { poolAddress: string; amountA: number; amountB: number; minLpOut?: number },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const { program, poolPublicKey, pool } = await getPoolAccountsForWrite(payload.poolAddress, safeContext);
    const tokenAMint = new PublicKey(toPublicKeyString(pool.tokenAMint)!);
    const tokenBMint = new PublicKey(toPublicKeyString(pool.tokenBMint)!);
    const lpMint = new PublicKey(toPublicKeyString(pool.lpMint)!);
    const [tokenADecimals, tokenBDecimals, lpDecimals] = await Promise.all([
      getMintDecimals(safeContext.connection, tokenAMint),
      getMintDecimals(safeContext.connection, tokenBMint),
      getMintDecimals(safeContext.connection, lpMint),
    ]);

    const [userTokenA, userTokenB] = await Promise.all([
      findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, tokenAMint),
      findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, tokenBMint),
    ]);
    if (!userTokenA || !userTokenB) {
      throw new Error("Connected wallet is missing one of the source token accounts for this pool.");
    }

    const [positionPda] = getLiquidityPositionPda(poolPublicKey, safeContext.publicKey);
    const existingPosition = await program.account.userLiquidityPosition.fetchNullable(positionPda);
    if (existingPosition) {
      throw new Error("This program scaffold currently supports one on-chain LP position per pool per wallet.");
    }

    const { address: userLpToken, createInstruction } = await getAtaWithOptionalCreateInstruction(
      safeContext.connection,
      safeContext.publicKey,
      safeContext.publicKey,
      lpMint,
    );

    const signature = await program.methods
      .addLiquidity(
        new BN(toBaseUnits(payload.amountA, tokenADecimals).toString()),
        new BN(toBaseUnits(payload.amountB, tokenBDecimals).toString()),
        new BN(toBaseUnits(payload.minLpOut || 0, lpDecimals).toString()),
      )
      .accountsStrict({
        pool: poolPublicKey,
        position: positionPda,
        owner: safeContext.publicKey,
        userTokenA,
        userTokenB,
        userLpToken,
        reserveAVault: new PublicKey(toPublicKeyString(pool.reserveAVault)!),
        reserveBVault: new PublicKey(toPublicKeyString(pool.reserveBVault)!),
        lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .preInstructions(createInstruction ? [createInstruction] : [])
      .rpc();

    return buildConfirmedActionResult("Add Liquidity", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function removeLiquidity(
  payload: { poolAddress: string; lpAmount: number },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const { program, poolPublicKey, pool } = await getPoolAccountsForWrite(payload.poolAddress, safeContext);
    const [positionPda] = getLiquidityPositionPda(poolPublicKey, safeContext.publicKey);
    const position = await program.account.userLiquidityPosition.fetch(positionPda);
    const tokenAMint = new PublicKey(toPublicKeyString(pool.tokenAMint)!);
    const tokenBMint = new PublicKey(toPublicKeyString(pool.tokenBMint)!);
    const lpMint = new PublicKey(toPublicKeyString(pool.lpMint)!);
    const [userTokenA, userTokenB, userLpToken, lpDecimals] = await Promise.all([
      findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, tokenAMint),
      findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, tokenBMint),
      findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, lpMint),
      getMintDecimals(safeContext.connection, lpMint),
    ]);
    if (!userTokenA || !userTokenB || !userLpToken) {
      throw new Error("Required token accounts for removing liquidity were not found.");
    }

    const signature = await program.methods
      .removeLiquidity(new BN(toBaseUnits(payload.lpAmount, lpDecimals).toString()))
      .accountsStrict({
        pool: poolPublicKey,
        position: positionPda,
        owner: safeContext.publicKey,
        userTokenA,
        userTokenB,
        userLpToken,
        reserveAVault: new PublicKey(toPublicKeyString(pool.reserveAVault)!),
        reserveBVault: new PublicKey(toPublicKeyString(pool.reserveBVault)!),
        lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return buildConfirmedActionResult("Remove Liquidity", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function swapTokens(
  payload: { poolAddress: string; fromMint: string; toMint: string; amountIn: number; minOut?: number },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const { program, poolPublicKey, pool } = await getPoolAccountsForWrite(payload.poolAddress, safeContext);
    const tokenAMint = new PublicKey(toPublicKeyString(pool.tokenAMint)!);
    const tokenBMint = new PublicKey(toPublicKeyString(pool.tokenBMint)!);
    const fromMint = new PublicKey(payload.fromMint);
    const toMint = new PublicKey(payload.toMint);
    const aToB = fromMint.toBase58() === tokenAMint.toBase58() && toMint.toBase58() === tokenBMint.toBase58();
    const bToA = fromMint.toBase58() === tokenBMint.toBase58() && toMint.toBase58() === tokenAMint.toBase58();
    if (!aToB && !bToA) {
      throw new Error("Selected swap mints do not match the chosen on-chain pool.");
    }

    const [sourceAccount, sourceDecimals, destinationDecimals, destinationAta] = await Promise.all([
      findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, fromMint),
      getMintDecimals(safeContext.connection, fromMint),
      getMintDecimals(safeContext.connection, toMint),
      getAtaWithOptionalCreateInstruction(safeContext.connection, safeContext.publicKey, safeContext.publicKey, toMint),
    ]);
    if (!sourceAccount) {
      throw new Error("Source token account not found for the selected swap asset.");
    }

    const signature = await program.methods
      .swapExactInput(
        new BN(toBaseUnits(payload.amountIn, sourceDecimals).toString()),
        new BN(toBaseUnits(payload.minOut || 0, destinationDecimals).toString()),
        aToB,
      )
      .accountsStrict({
        pool: poolPublicKey,
        owner: safeContext.publicKey,
        userSourceToken: sourceAccount,
        userDestinationToken: destinationAta.address,
        reserveAVault: new PublicKey(toPublicKeyString(pool.reserveAVault)!),
        reserveBVault: new PublicKey(toPublicKeyString(pool.reserveBVault)!),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(destinationAta.createInstruction ? [destinationAta.createInstruction] : [])
      .rpc();

    return buildConfirmedActionResult("Swap Tokens", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function setPoolFee(
  payload: { poolAddress: string; feeRateBps: number },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const { program, poolPublicKey } = await getPoolAccountsForWrite(payload.poolAddress, safeContext);
    const signature = await program.methods
      .setPoolFee(new BN(payload.feeRateBps))
      .accountsStrict({ pool: poolPublicKey, admin: safeContext.publicKey })
      .rpc();
    return buildConfirmedActionResult("Update Pool Fee", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function pausePool(poolAddress: string, context?: ProgramActionContext) {
  try {
    const safeContext = requireProgramContext(context);
    const { program, poolPublicKey } = await getPoolAccountsForWrite(poolAddress, safeContext);
    const signature = await program.methods.pausePool().accountsStrict({ pool: poolPublicKey, admin: safeContext.publicKey }).rpc();
    return buildConfirmedActionResult("Pause Pool", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function resumePool(poolAddress: string, context?: ProgramActionContext) {
  try {
    const safeContext = requireProgramContext(context);
    const { program, poolPublicKey } = await getPoolAccountsForWrite(poolAddress, safeContext);
    const signature = await program.methods.resumePool().accountsStrict({ pool: poolPublicKey, admin: safeContext.publicKey }).rpc();
    return buildConfirmedActionResult("Resume Pool", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}
