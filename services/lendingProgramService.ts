import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";

import { getLendingProgram } from "@/lib/solana/programs/lendingProgram";
import { getLendingPositionPda } from "@/lib/solana/pda";
import type {
  OnChainActionResult,
  OnChainLendingMarketSummary,
  OnChainLendingPositionSummary,
  OnChainProgramStatus,
} from "@/types";
import {
  buildConfirmedActionResult,
  buildProgramStatus,
  createProgramProvider,
  findOwnedTokenAccount,
  fromBaseUnits,
  getMintDecimals,
  normalizeActionError,
  ProgramActionContext,
  requireProgramContext,
  toBaseUnits,
  toNumber,
  toPublicKeyString,
} from "@/services/programs/shared";
import { buildExplorerAddressUrl } from "@/lib/solana";

type LendingState = {
  program: OnChainProgramStatus;
  markets: OnChainLendingMarketSummary[];
  rawMarkets: Array<{ publicKey: PublicKey; account: Record<string, unknown> }>;
};

function formatMintLabel(mint: string) {
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

async function getReadonlyLendingState(): Promise<LendingState> {
  const program = getLendingProgram();
  const rawMarkets = await program.account.lendingMarketConfig.all().catch(() => []);
  const primaryMarket = rawMarkets[0]?.publicKey.toBase58();
  const status = await buildProgramStatus({
    module: "lending",
    label: "Lending Program",
    programId: program.programId,
    configAddress: primaryMarket,
    notes: [
      "Collateral, debt, and health factor state are fetched directly from Solana PDA accounts.",
      "Borrow, repay, and withdraw calls are submitted as signed Anchor program instructions.",
    ],
  });

  const markets = await Promise.all(
    rawMarkets.map(async (entry: { publicKey: PublicKey; account: Record<string, unknown> }) => {
      const account = entry.account as Record<string, unknown>;
      return {
        address: entry.publicKey.toBase58(),
        explorerUrl: buildExplorerAddressUrl(entry.publicKey.toBase58()),
        admin: toPublicKeyString(account.admin),
        collateralMint: formatMintLabel(toPublicKeyString(account.collateralMint)!),
        borrowMint: formatMintLabel(toPublicKeyString(account.borrowMint)!),
        collateralVault: toPublicKeyString(account.collateralVault),
        liquidityVault: toPublicKeyString(account.liquidityVault),
        collateralFactorBps: toNumber(account.collateralFactorBps),
        liquidationThresholdBps: toNumber(account.liquidationThresholdBps),
        borrowInterestBps: toNumber(account.borrowInterestBps),
        protocolFeeBps: toNumber(account.protocolFeeBps),
        paused: Boolean(account.paused),
        source: "on-chain" as const,
      };
    }),
  );

  return { program: status, markets, rawMarkets };
}

export async function fetchLendingMarkets() {
  return getReadonlyLendingState();
}

export async function fetchMarket(): Promise<{ program: OnChainProgramStatus; market: OnChainLendingMarketSummary | null }> {
  const { program, markets } = await getReadonlyLendingState();
  return {
    program,
    market: markets[0] || null,
  };
}

export async function fetchLendingMarket() {
  return fetchMarket();
}

export async function fetchUserPosition(walletAddress?: string | null): Promise<OnChainLendingPositionSummary | null> {
  if (!walletAddress) {
    return null;
  }

  const owner = new PublicKey(walletAddress);
  const program = getLendingProgram();
  const positions = await program.account.userLendingPosition.all().catch(() => []);
  const position = positions.find(
    (entry: { publicKey: PublicKey; account: Record<string, unknown> }) =>
      toPublicKeyString(entry.account.owner) === owner.toBase58(),
  );
  if (!position) {
    return null;
  }

  const account = position.account as Record<string, unknown>;
  return {
    address: position.publicKey.toBase58(),
    marketAddress: toPublicKeyString(account.market)!,
    explorerUrl: buildExplorerAddressUrl(position.publicKey.toBase58()),
    collateralAmount: toNumber(account.collateralDeposited),
    borrowedAmount: toNumber(account.borrowedAmount),
    interestDebt: toNumber(account.interestDebt),
    healthFactor: toNumber(account.healthFactorSnapshot) / 100,
    source: "on-chain",
  };
}

async function getWritableMarket(context: ProgramActionContext, marketAddress?: string) {
  const provider = createProgramProvider(context);
  const program = getLendingProgram(provider);
  const allMarkets = await program.account.lendingMarketConfig.all();
  const selectedMarket = marketAddress
    ? allMarkets.find((entry: { publicKey: PublicKey; account: Record<string, unknown> }) => entry.publicKey.toBase58() === marketAddress)
    : allMarkets[0];
  if (!selectedMarket) {
    throw new Error("No deployed lending market PDA was found on Devnet.");
  }

  return {
    program,
    marketPublicKey: selectedMarket.publicKey,
    market: selectedMarket.account as Record<string, unknown>,
  };
}

export async function depositCollateral(
  payload: { amount: number; marketAddress?: string },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const { program, marketPublicKey, market } = await getWritableMarket(safeContext, payload.marketAddress);
    const collateralMint = new PublicKey(toPublicKeyString(market.collateralMint)!);
    const decimals = await getMintDecimals(safeContext.connection, collateralMint);
    const userCollateralAccount = await findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, collateralMint);
    if (!userCollateralAccount) {
      throw new Error("Collateral token account not found for the connected wallet.");
    }

    const [positionPda] = getLendingPositionPda(marketPublicKey, safeContext.publicKey);
    const signature = await program.methods
      .depositCollateral(new BN(toBaseUnits(payload.amount, decimals).toString()))
      .accountsStrict({
        market: marketPublicKey,
        position: positionPda,
        owner: safeContext.publicKey,
        userCollateralAccount,
        collateralVault: new PublicKey(toPublicKeyString(market.collateralVault)!),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return buildConfirmedActionResult("Deposit Collateral", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function borrow(
  payload: { amount: number; marketAddress?: string },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const { program, marketPublicKey, market } = await getWritableMarket(safeContext, payload.marketAddress);
    const borrowMint = new PublicKey(toPublicKeyString(market.borrowMint)!);
    const decimals = await getMintDecimals(safeContext.connection, borrowMint);
    const userBorrowAccount = await findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, borrowMint);
    if (!userBorrowAccount) {
      throw new Error("Borrow token account not found for the connected wallet.");
    }

    const [positionPda] = getLendingPositionPda(marketPublicKey, safeContext.publicKey);
    const signature = await program.methods
      .borrowTokens(new BN(toBaseUnits(payload.amount, decimals).toString()))
      .accountsStrict({
        market: marketPublicKey,
        position: positionPda,
        owner: safeContext.publicKey,
        userBorrowAccount,
        liquidityVault: new PublicKey(toPublicKeyString(market.liquidityVault)!),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return buildConfirmedActionResult("Borrow Tokens", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function repay(
  payload: { amount: number; marketAddress?: string },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const { program, marketPublicKey, market } = await getWritableMarket(safeContext, payload.marketAddress);
    const borrowMint = new PublicKey(toPublicKeyString(market.borrowMint)!);
    const decimals = await getMintDecimals(safeContext.connection, borrowMint);
    const userBorrowAccount = await findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, borrowMint);
    if (!userBorrowAccount) {
      throw new Error("Repay token account not found for the connected wallet.");
    }

    const [positionPda] = getLendingPositionPda(marketPublicKey, safeContext.publicKey);
    const signature = await program.methods
      .repayTokens(new BN(toBaseUnits(payload.amount, decimals).toString()))
      .accountsStrict({
        market: marketPublicKey,
        position: positionPda,
        owner: safeContext.publicKey,
        userBorrowAccount,
        liquidityVault: new PublicKey(toPublicKeyString(market.liquidityVault)!),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return buildConfirmedActionResult("Repay Loan", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function withdraw(
  payload: { amount: number; marketAddress?: string },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const { program, marketPublicKey, market } = await getWritableMarket(safeContext, payload.marketAddress);
    const collateralMint = new PublicKey(toPublicKeyString(market.collateralMint)!);
    const decimals = await getMintDecimals(safeContext.connection, collateralMint);
    const userCollateralAccount = await findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, collateralMint);
    if (!userCollateralAccount) {
      throw new Error("Collateral token account not found for the connected wallet.");
    }

    const [positionPda] = getLendingPositionPda(marketPublicKey, safeContext.publicKey);
    const signature = await program.methods
      .withdrawCollateral(new BN(toBaseUnits(payload.amount, decimals).toString()))
      .accountsStrict({
        market: marketPublicKey,
        position: positionPda,
        owner: safeContext.publicKey,
        userCollateralAccount,
        collateralVault: new PublicKey(toPublicKeyString(market.collateralVault)!),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return buildConfirmedActionResult("Withdraw Collateral", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function updateMarketParams(
  payload: {
    marketAddress: string;
    collateralFactorBps: number;
    liquidationThresholdBps: number;
    borrowInterestBps: number;
    protocolFeeBps: number;
    paused: boolean;
  },
  context?: ProgramActionContext,
) {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getLendingProgram(provider);
    const signature = await program.methods
      .updateMarketParams(
        new BN(payload.collateralFactorBps),
        new BN(payload.liquidationThresholdBps),
        new BN(payload.borrowInterestBps),
        new BN(payload.protocolFeeBps),
        payload.paused,
      )
      .accountsStrict({
        market: new PublicKey(payload.marketAddress),
        admin: safeContext.publicKey,
      })
      .rpc();
    return buildConfirmedActionResult("Update Lending Market", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function pauseMarket(marketAddress: string, context?: ProgramActionContext) {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getLendingProgram(provider);
    const signature = await program.methods.pauseMarket().accountsStrict({
      market: new PublicKey(marketAddress),
      admin: safeContext.publicKey,
    }).rpc();
    return buildConfirmedActionResult("Pause Lending Market", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function resumeMarket(marketAddress: string, context?: ProgramActionContext) {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getLendingProgram(provider);
    const signature = await program.methods.resumeMarket().accountsStrict({
      market: new PublicKey(marketAddress),
      admin: safeContext.publicKey,
    }).rpc();
    return buildConfirmedActionResult("Resume Lending Market", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}
