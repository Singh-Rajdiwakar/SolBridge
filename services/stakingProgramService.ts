import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { getStakingProgram } from "@/lib/solana/programs/stakingProgram";
import { getLockPeriodPda, getStakePositionPda, getStakingConfigPda } from "@/lib/solana/pda";
import type {
  OnChainActionResult,
  OnChainLockPeriodSummary,
  OnChainStakePosition,
  OnChainStakingConfig,
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
  toPublicKeyString,
} from "@/services/programs/shared";
import { buildExplorerAddressUrl } from "@/lib/solana";

const STAKING_CONFIG_NOT_FOUND = "Staking config PDA is not deployed on Devnet.";

function calculatePendingRewards(params: {
  stakedAmount: number;
  apyBps: number;
  startTime: number;
  endTime: number;
  claimedRewards: number;
  unstaked?: boolean;
}) {
  if (params.unstaked) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  const rewardCutoff = Math.min(now, params.endTime);
  const elapsedSeconds = Math.max(0, rewardCutoff - params.startTime);
  const totalAccrued =
    (params.stakedAmount * params.apyBps * elapsedSeconds) / 10_000 / 31_536_000;
  return Math.max(0, totalAccrued - params.claimedRewards);
}

async function getReadonlyStakingAccounts() {
  const [configPda] = getStakingConfigPda();
  const program = getStakingProgram();
  const programStatus = await buildProgramStatus({
    module: "staking",
    label: "Staking Program",
    programId: program.programId,
    configAddress: configPda.toBase58(),
    notes: [
      "Stake positions are fetched directly from Anchor PDA accounts on Solana.",
      "Reward accrual, lock periods, claim, and unstake rules are enforced on-chain.",
    ],
  });

  if (!programStatus.deployed) {
    return { program, programStatus, configPda, config: null, lockPeriods: [] as Awaited<ReturnType<typeof program.account.lockPeriod.all>> };
  }

  const [config, lockPeriods] = await Promise.all([
    program.account.stakingConfig.fetchNullable(configPda),
    program.account.lockPeriod.all(),
  ]);

  return {
    program,
    programStatus,
    configPda,
    config,
    lockPeriods: lockPeriods.filter(
      (entry: { publicKey: PublicKey; account: Record<string, unknown> }) =>
        toPublicKeyString(entry.account.config) === configPda.toBase58(),
    ),
  };
}

function mapLockPeriod(entry: {
  publicKey: PublicKey;
  account: Record<string, unknown>;
}) {
  return {
    address: entry.publicKey.toBase58(),
    label: String(entry.account.label || "Lock Period"),
    durationDays: toNumber(entry.account.durationDays),
    apyBps: toNumber(entry.account.apyBps),
    enabled: Boolean(entry.account.enabled),
    minAmount: toNumber(entry.account.minAmount),
    penaltyBps: toNumber(entry.account.earlyUnstakePenaltyBps),
    earlyUnstakeEnabled: Boolean(entry.account.earlyUnstakeEnabled),
  };
}

export async function fetchStakingConfig(): Promise<OnChainStakingConfig> {
  const { programStatus, config, lockPeriods } = await getReadonlyStakingAccounts();

  if (!config) {
    return {
      program: programStatus,
      stakingEnabled: false,
      rewardRateBps: 0,
      lockPeriods: [],
    };
  }

  return {
    program: programStatus,
    admin: toPublicKeyString(config.admin),
    stakingMint: toPublicKeyString(config.stakingMint),
    rewardMint: toPublicKeyString(config.rewardMint),
    treasuryVault: toPublicKeyString(config.treasuryVault),
    rewardVault: toPublicKeyString(config.rewardVault),
    stakingEnabled: Boolean(config.stakingEnabled),
    rewardRateBps: toNumber(config.rewardRateBps),
    lockPeriods: lockPeriods
      .map(mapLockPeriod)
      .sort(
        (left: OnChainLockPeriodSummary, right: OnChainLockPeriodSummary) =>
          left.durationDays - right.durationDays,
      ),
  };
}

export async function fetchLockPeriods() {
  const config = await fetchStakingConfig();
  return config.lockPeriods;
}

export async function fetchUserStakePositions(walletAddress?: string | null): Promise<OnChainStakePosition[]> {
  if (!walletAddress) {
    return [];
  }

  const { programStatus, program, configPda, config, lockPeriods } = await getReadonlyStakingAccounts();
  if (!programStatus.deployed || !config) {
    return [];
  }

  const owner = new PublicKey(walletAddress);
  const ownerPositions = (await program.account.stakePosition.all()).filter(
    (entry: { publicKey: PublicKey; account: Record<string, unknown> }) => {
    return toPublicKeyString(entry.account.owner) === owner.toBase58() && toPublicKeyString(entry.account.config) === configPda.toBase58();
    },
  );

  const stakingDecimals = config.stakingMint ? await getMintDecimals(program.provider.connection, new PublicKey(config.stakingMint)) : 0;
  const lockPeriodMap = new Map<string, OnChainLockPeriodSummary>(
    lockPeriods.map((entry: { publicKey: PublicKey; account: Record<string, unknown> }) => [
      entry.publicKey.toBase58(),
      mapLockPeriod(entry),
    ]),
  );

  return ownerPositions.map((entry: { publicKey: PublicKey; account: Record<string, unknown> }) => {
    const account = entry.account as Record<string, unknown>;
    const lockPeriod = lockPeriodMap.get(String(toPublicKeyString(account.lockPeriod)));
    const amount = fromBaseUnits(toNumber(account.stakedAmount), stakingDecimals);
    const claimedRewards = fromBaseUnits(toNumber(account.claimedRewards), stakingDecimals);
    const startedAt = toNumber(account.startTime);
    const endsAt = toNumber(account.endTime);
    return {
      address: entry.publicKey.toBase58(),
      explorerUrl: buildExplorerAddressUrl(entry.publicKey.toBase58()),
      amount,
      lockLabel: lockPeriod?.label,
      durationDays: toNumber(account.lockDurationDays) || lockPeriod?.durationDays || 0,
      startedAt,
      endsAt,
      claimedRewards,
      pendingRewards: calculatePendingRewards({
        stakedAmount: amount,
        apyBps: lockPeriod?.apyBps || 0,
        startTime: startedAt,
        endTime: endsAt,
        claimedRewards,
        unstaked: Boolean(account.unstaked),
      }),
      unstaked: Boolean(account.unstaked),
      source: "on-chain",
    };
  });
}

export async function fetchUserStakes(walletAddress?: string | null) {
  return fetchUserStakePositions(walletAddress);
}

export async function stakeTokens(
  payload: { amount: number; lockPeriod: number },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getStakingProgram(provider);
    const [configPda] = getStakingConfigPda();
    const [config, lockPeriodPda] = await Promise.all([
      program.account.stakingConfig.fetchNullable(configPda),
      Promise.resolve(getLockPeriodPda(payload.lockPeriod)[0]),
    ]);

    if (!config) {
      throw new Error(STAKING_CONFIG_NOT_FOUND);
    }

    const lockPeriod = await program.account.lockPeriod.fetchNullable(lockPeriodPda);
    if (!lockPeriod) {
      throw new Error("Selected lock period PDA was not found on-chain.");
    }

    const stakingMint = new PublicKey(toPublicKeyString(config.stakingMint)!);
    const stakingDecimals = await getMintDecimals(safeContext.connection, stakingMint);
    const userStakeAccount = await findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, stakingMint);
    if (!userStakeAccount) {
      throw new Error("No staking token account found for the connected wallet.");
    }

    const positionNonce = BigInt(Date.now());
    const [positionPda] = getStakePositionPda(safeContext.publicKey, positionNonce);
    const signature = await program.methods
      .stakeTokens(new BN(toBaseUnits(payload.amount, stakingDecimals).toString()), new BN(positionNonce.toString()))
      .accountsStrict({
        config: configPda,
        lockPeriod: lockPeriodPda,
        position: positionPda,
        owner: safeContext.publicKey,
        userStakeAccount,
        treasuryVault: new PublicKey(toPublicKeyString(config.treasuryVault)!),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return buildConfirmedActionResult("Stake Tokens", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function claimRewards(positionPda: string, context?: ProgramActionContext): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getStakingProgram(provider);
    const [configPda] = getStakingConfigPda();
    const config = await program.account.stakingConfig.fetchNullable(configPda);
    if (!config) {
      throw new Error(STAKING_CONFIG_NOT_FOUND);
    }

    const positionPublicKey = new PublicKey(positionPda);
    const position = await program.account.stakePosition.fetch(positionPublicKey);
    const lockPeriodPublicKey = new PublicKey(toPublicKeyString(position.lockPeriod)!);
    const lockPeriod = await program.account.lockPeriod.fetch(lockPeriodPublicKey);
    const rewardMint = new PublicKey(toPublicKeyString(config.rewardMint)!);
    const { address: rewardAta, createInstruction } = await getAtaWithOptionalCreateInstruction(
      safeContext.connection,
      safeContext.publicKey,
      safeContext.publicKey,
      rewardMint,
    );

    const builder = program.methods.claimRewards().accountsStrict({
      config: configPda,
      lockPeriod: lockPeriodPublicKey,
      position: positionPublicKey,
      owner: safeContext.publicKey,
      rewardVault: new PublicKey(toPublicKeyString(config.rewardVault)!),
      userRewardAccount: rewardAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    });

    const signature = await (createInstruction ? builder.preInstructions([createInstruction]) : builder).rpc();
    return buildConfirmedActionResult("Claim Rewards", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function unstakeTokens(positionPda: string, context?: ProgramActionContext): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getStakingProgram(provider);
    const [configPda] = getStakingConfigPda();
    const config = await program.account.stakingConfig.fetchNullable(configPda);
    if (!config) {
      throw new Error(STAKING_CONFIG_NOT_FOUND);
    }

    const positionPublicKey = new PublicKey(positionPda);
    const position = await program.account.stakePosition.fetch(positionPublicKey);
    const lockPeriodPublicKey = new PublicKey(toPublicKeyString(position.lockPeriod)!);
    await program.account.lockPeriod.fetch(lockPeriodPublicKey);

    const stakingMint = new PublicKey(toPublicKeyString(config.stakingMint)!);
    const rewardMint = new PublicKey(toPublicKeyString(config.rewardMint)!);
    const userStakeAccount = await findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, stakingMint);
    if (!userStakeAccount) {
      throw new Error("No staking token account found for this wallet.");
    }

    const { address: rewardAta, createInstruction } = await getAtaWithOptionalCreateInstruction(
      safeContext.connection,
      safeContext.publicKey,
      safeContext.publicKey,
      rewardMint,
    );

    const builder = program.methods.unstakeTokens().accountsStrict({
      config: configPda,
      lockPeriod: lockPeriodPublicKey,
      position: positionPublicKey,
      owner: safeContext.publicKey,
      userStakeAccount,
      userRewardAccount: rewardAta,
      treasuryVault: new PublicKey(toPublicKeyString(config.treasuryVault)!),
      rewardVault: new PublicKey(toPublicKeyString(config.rewardVault)!),
      tokenProgram: TOKEN_PROGRAM_ID,
    });

    const signature = await (createInstruction ? builder.preInstructions([createInstruction]) : builder).rpc();
    return buildConfirmedActionResult("Unstake Position", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function pauseStaking(context?: ProgramActionContext): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getStakingProgram(provider);
    const [configPda] = getStakingConfigPda();
    const signature = await program.methods.pauseStaking().accountsStrict({
      config: configPda,
      admin: safeContext.publicKey,
    }).rpc();
    return buildConfirmedActionResult("Pause Staking", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function resumeStaking(context?: ProgramActionContext): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getStakingProgram(provider);
    const [configPda] = getStakingConfigPda();
    const signature = await program.methods.resumeStaking().accountsStrict({
      config: configPda,
      admin: safeContext.publicKey,
    }).rpc();
    return buildConfirmedActionResult("Resume Staking", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function createLockPeriodOnChain(
  payload: {
    label: string;
    durationDays: number;
    apyBps: number;
    minAmount: number;
    earlyUnstakePenaltyBps: number;
    earlyUnstakeEnabled: boolean;
  },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getStakingProgram(provider);
    const [configPda] = getStakingConfigPda();
    const [lockPeriodPda] = getLockPeriodPda(payload.durationDays);
    const signature = await program.methods
      .createLockPeriod(
        payload.label,
        new BN(payload.durationDays),
        new BN(payload.apyBps),
        new BN(payload.minAmount),
        new BN(payload.earlyUnstakePenaltyBps),
        payload.earlyUnstakeEnabled,
      )
      .accountsStrict({
        config: configPda,
        lockPeriod: lockPeriodPda,
        admin: safeContext.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return buildConfirmedActionResult("Create Lock Period", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function updateLockPeriodOnChain(
  payload: {
    durationDays: number;
    apyBps: number;
    minAmount: number;
    earlyUnstakePenaltyBps: number;
    earlyUnstakeEnabled: boolean;
    enabled: boolean;
  },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getStakingProgram(provider);
    const [configPda] = getStakingConfigPda();
    const [lockPeriodPda] = getLockPeriodPda(payload.durationDays);
    const signature = await program.methods
      .updateLockPeriod(
        new BN(payload.apyBps),
        new BN(payload.minAmount),
        new BN(payload.earlyUnstakePenaltyBps),
        payload.earlyUnstakeEnabled,
        payload.enabled,
      )
      .accountsStrict({
        config: configPda,
        lockPeriod: lockPeriodPda,
        admin: safeContext.publicKey,
      })
      .rpc();

    return buildConfirmedActionResult("Update Lock Period", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}
