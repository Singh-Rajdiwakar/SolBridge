import { BN } from "@coral-xyz/anchor";
import type { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";

import governanceIdl from "@/lib/solana/idl/governance_program.json";
import lendingIdl from "@/lib/solana/idl/lending_program.json";
import liquidityIdl from "@/lib/solana/idl/liquidity_program.json";
import stakingIdl from "@/lib/solana/idl/staking_program.json";
import { buildExplorerAddressUrl, buildExplorerUrl, shortenAddress, SOLANA_NETWORK } from "@/lib/solana";
import { normalizeSolanaError } from "@/lib/solana/errors";
import {
  getGovernanceConfigPda,
  getLendingMarketPda,
  getLendingPositionPda,
  getLiquidityPositionPda,
  getLockPeriodPda,
  getPoolPda,
  getProposalPda,
  getStakePositionPda,
  getStakingConfigPda,
  getVoteRecordPda,
} from "@/lib/solana/pda";
import { getGovernanceProgram } from "@/lib/solana/programs/governanceProgram";
import { getLendingProgram } from "@/lib/solana/programs/lendingProgram";
import { getLiquidityProgram } from "@/lib/solana/programs/liquidityProgram";
import { getStakingProgram } from "@/lib/solana/programs/stakingProgram";
import {
  GOVERNANCE_PROGRAM_ID,
  LENDING_PROGRAM_ID,
  LIQUIDITY_PROGRAM_ID,
  STAKING_PROGRAM_ID,
} from "@/lib/solana/programIds";
import { DEFAULT_COMMITMENT } from "@/lib/solana/provider";
import {
  createProgramProvider,
  findOwnedTokenAccount,
  toPublicKeyString,
  type ProgramActionContext,
} from "@/services/programs/shared";

export type ContractConsoleProgramKey = "staking" | "liquidity" | "lending" | "governance";
export type ContractConsoleMode = "friendly" | "raw";
export type ContractConsoleValueKind = "string" | "number" | "boolean" | "publicKey" | "enum" | "array";

type IdlInstructionLike = {
  name: string;
  accounts?: Array<{ name: string; signer?: boolean; writable?: boolean }>;
  args?: Array<{ name: string; type: unknown }>;
};

type IdlTypeLike = {
  name: string;
  type?: {
    kind?: string;
    fields?: Array<{ name: string; type: unknown }>;
    variants?: Array<{ name: string }>;
  };
};

type CatalogEntry = {
  key: ContractConsoleProgramKey;
  label: string;
  shortDescription: string;
  longDescription: string;
  idl: Idl & {
    metadata?: {
      name?: string;
      version?: string;
      description?: string;
    };
    instructions?: IdlInstructionLike[];
    accounts?: Array<{ name: string }>;
    types?: IdlTypeLike[];
  };
  programId: PublicKey;
  getProgram: (provider?: AnchorProvider) => Program;
  defaultInstruction: string;
  pinnedInstructions: string[];
};

export type ContractConsoleProgramSummary = {
  key: ContractConsoleProgramKey;
  label: string;
  shortDescription: string;
  longDescription: string;
  programId: string;
  network: string;
  version: string;
  addressLoaded: boolean;
  accountTypes: string[];
  instructionCount: number;
};

export type ContractInstructionArgField = {
  name: string;
  label: string;
  kind: ContractConsoleValueKind;
  rawType: string;
  placeholder: string;
  enumValues?: string[];
  required: boolean;
  helperText?: string;
};

export type ContractInstructionAccountField = {
  name: string;
  label: string;
  signer: boolean;
  writable: boolean;
  required: boolean;
  helperText?: string;
};

export type ContractInstructionSummary = {
  name: string;
  label: string;
  description: string;
  args: ContractInstructionArgField[];
  accounts: ContractInstructionAccountField[];
  signerRequired: boolean;
  adminOnly: boolean;
  cautionLevel: "safe" | "warning" | "danger";
  requiredArgsCount: number;
};

export type ContractResolvedAccount = {
  name: string;
  label: string;
  address?: string;
  shortAddress?: string;
  signer: boolean;
  writable: boolean;
  source: "derived" | "manual" | "default" | "missing";
  editable: boolean;
  note?: string;
};

export type ContractSimulationResult = {
  success: boolean;
  estimatedFeeLamports: number;
  logs: string[];
  unitsConsumed?: number | null;
  error?: string | null;
};

export type ContractExecutionResult = {
  signature: string;
  explorerUrl: string;
  status: "confirmed" | "submitted";
  slot?: number;
  blockTime?: string | null;
  logs: string[];
  unitsConsumed?: number | null;
  outputs: Array<{
    label: string;
    value: string;
    explorerUrl?: string;
  }>;
};

export type ContractAccountState = {
  address: string;
  accountType: string;
  explorerUrl: string;
  decoded: Record<string, unknown> | null;
  lamports: number;
  owner: string;
  executable: boolean;
};

export type ContractSavedCall = {
  id: string;
  label: string;
  programKey: ContractConsoleProgramKey;
  instructionName: string;
  mode: ContractConsoleMode;
  argValues: Record<string, string>;
  accountOverrides: Record<string, string>;
  createdAt: string;
};

export type ContractInstructionHistoryEntry = {
  id: string;
  timestamp: string;
  walletAddress?: string | null;
  programKey: ContractConsoleProgramKey;
  instructionName: string;
  status: "confirmed" | "failed";
  signature?: string;
  error?: string;
  argValues: Record<string, string>;
  accountOverrides: Record<string, string>;
};

export type ContractPreviewSummary = {
  estimatedFeeLamports: number;
  resolvedAccounts: ContractResolvedAccount[];
  unresolvedCount: number;
  signerWallet?: string | null;
};

const CONTRACT_PROGRAMS: Record<ContractConsoleProgramKey, CatalogEntry> = {
  staking: {
    key: "staking",
    label: "Staking Program",
    shortDescription: "Manage lock periods, staking positions, rewards, and pause state.",
    longDescription:
      "Anchor program for staking config, stake positions, reward claims, and protocol admin controls.",
    idl: stakingIdl as CatalogEntry["idl"],
    programId: STAKING_PROGRAM_ID,
    getProgram: (provider?: AnchorProvider) => getStakingProgram(provider),
    defaultInstruction: "stakeTokens",
    pinnedInstructions: ["stakeTokens", "claimRewards", "unstakeTokens"],
  },
  liquidity: {
    key: "liquidity",
    label: "Liquidity Program",
    shortDescription: "AMM pool setup, LP management, swaps, and fee updates.",
    longDescription:
      "Anchor program for pool state, LP positions, constant-product swaps, and admin pool controls.",
    idl: liquidityIdl as CatalogEntry["idl"],
    programId: LIQUIDITY_PROGRAM_ID,
    getProgram: (provider?: AnchorProvider) => getLiquidityProgram(provider),
    defaultInstruction: "addLiquidity",
    pinnedInstructions: ["addLiquidity", "removeLiquidity", "swapExactInput"],
  },
  lending: {
    key: "lending",
    label: "Lending Program",
    shortDescription: "Deposit collateral, borrow, repay, withdraw, and liquidate.",
    longDescription:
      "Anchor program for collateralized lending market config and user lending positions.",
    idl: lendingIdl as CatalogEntry["idl"],
    programId: LENDING_PROGRAM_ID,
    getProgram: (provider?: AnchorProvider) => getLendingProgram(provider),
    defaultInstruction: "depositCollateral",
    pinnedInstructions: ["depositCollateral", "borrowTokens", "repayTokens", "withdrawCollateral"],
  },
  governance: {
    key: "governance",
    label: "Governance Program",
    shortDescription: "Create proposals, cast votes, finalize, and update governance config.",
    longDescription:
      "Anchor program for DAO proposal lifecycle, vote records, and governance parameters.",
    idl: governanceIdl as CatalogEntry["idl"],
    programId: GOVERNANCE_PROGRAM_ID,
    getProgram: (provider?: AnchorProvider) => getGovernanceProgram(provider),
    defaultInstruction: "createProposal",
    pinnedInstructions: ["createProposal", "castVote", "finalizeProposal"],
  },
};

const INSTRUCTION_DESCRIPTIONS: Record<string, string> = {
  initializeStakingConfig: "Deploy staking config PDA and connect staking/reward vaults.",
  createLockPeriod: "Create a new staking lock period configuration on-chain.",
  updateLockPeriod: "Update APY, minimum amount, or early unstake settings for an existing lock period.",
  stakeTokens: "Create a user stake position and transfer tokens into the treasury vault.",
  claimRewards: "Claim accumulated staking rewards into the connected wallet token account.",
  unstakeTokens: "Close out a mature stake position and return principal plus reward balance.",
  pauseStaking: "Pause new staking actions for the protocol.",
  resumeStaking: "Resume staking actions after a protocol pause.",
  initializePool: "Initialize a new AMM pool PDA with reserve vaults and LP mint.",
  addLiquidity: "Add token A and token B into the pool and mint LP position state.",
  removeLiquidity: "Burn LP exposure and return the underlying reserves proportionally.",
  swapExactInput: "Swap a source token into the destination token using pool reserves.",
  setPoolFee: "Update the AMM fee basis points for a pool.",
  pausePool: "Pause pool actions for swaps and liquidity changes.",
  resumePool: "Resume a paused pool.",
  initializeLendingMarket: "Initialize lending market PDAs and connect vault accounts.",
  depositCollateral: "Deposit collateral into the lending market and create/update position state.",
  borrowTokens: "Borrow liquidity against deposited collateral.",
  repayTokens: "Repay borrowed liquidity and reduce outstanding debt.",
  withdrawCollateral: "Withdraw collateral if the position remains healthy.",
  liquidatePosition: "Repay debt for an unhealthy position and seize collateral.",
  updateMarketParams: "Update lending market collateral, liquidation, and fee settings.",
  pauseMarket: "Pause lending market mutations.",
  resumeMarket: "Resume a paused lending market.",
  initializeGovernance: "Create the root governance config PDA.",
  updateGovernanceConfig: "Update quorum, voting duration, or proposal threshold.",
  createProposal: "Create a new on-chain governance proposal.",
  castVote: "Cast a token-weighted governance vote.",
  finalizeProposal: "Finalize proposal outcome after the voting window.",
  cancelProposal: "Cancel a proposal using authorized governance controls.",
};

const ADMIN_KEYWORDS = ["initialize", "update", "pause", "resume", "set", "cancel", "liquidate"];
const CAUTION_KEYWORDS = ["initialize", "pause", "resume", "liquidate", "cancel"];
const DANGEROUS_ACCOUNT_NAMES = ["admin", "authority", "liquidator"];

function startCase(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function slugifyInstruction(programKey: ContractConsoleProgramKey, instructionName: string) {
  return `${programKey}:${instructionName}`;
}

function isNumberish(type: string) {
  return ["u8", "u16", "u32", "u64", "u128", "i8", "i16", "i32", "i64", "i128"].includes(type);
}

function resolveDefinedType(typeName: string, idl: CatalogEntry["idl"]) {
  return idl.types?.find((entry) => entry.name === typeName) || null;
}

function getArgKind(type: unknown, idl: CatalogEntry["idl"]): ContractInstructionArgField["kind"] {
  if (typeof type === "string") {
    if (type === "string") {
      return "string";
    }
    if (type === "bool") {
      return "boolean";
    }
    if (type === "pubkey") {
      return "publicKey";
    }
    if (isNumberish(type)) {
      return "number";
    }
  }

  if (type && typeof type === "object") {
    const typeRecord = type as Record<string, unknown>;
    if ("vec" in typeRecord || "array" in typeRecord) {
      return "array";
    }
    if ("defined" in typeRecord) {
      const defined = typeRecord.defined as { name?: string } | undefined;
      const resolved = defined?.name ? resolveDefinedType(defined.name, idl) : null;
      if (resolved?.type?.kind === "enum") {
        return "enum";
      }
    }
  }

  return "string";
}

function getRawTypeLabel(type: unknown) {
  if (typeof type === "string") {
    return type;
  }
  if (type && typeof type === "object") {
    const record = type as Record<string, unknown>;
    if ("defined" in record) {
      const defined = record.defined as { name?: string };
      return defined?.name || "defined";
    }
    if ("vec" in record || "array" in record) {
      return "array";
    }
  }
  return "unknown";
}

function getEnumValues(type: unknown, idl: CatalogEntry["idl"]) {
  if (!type || typeof type !== "object") {
    return undefined;
  }
  const record = type as Record<string, unknown>;
  if (!("defined" in record)) {
    return undefined;
  }
  const defined = record.defined as { name?: string };
  const resolved = defined?.name ? resolveDefinedType(defined.name, idl) : null;
  return ((resolved?.type as { variants?: Array<{ name: string }> } | undefined)?.variants || []).map(
    (variant) => variant.name,
  );
}

function getPlaceholder(kind: ContractInstructionArgField["kind"], name: string, enumValues?: string[]) {
  switch (kind) {
    case "number":
      return "Enter numeric value";
    case "boolean":
      return "true / false";
    case "publicKey":
      return "Paste Solana address";
    case "enum":
      return enumValues?.[0] || "Select value";
    case "array":
      return "Comma-separated values";
    default:
      if (/time|date/i.test(name)) {
        return "Unix timestamp";
      }
      if (/uri/i.test(name)) {
        return "retix://resource or https://...";
      }
      return "Enter value";
  }
}

function deserializeUiValue(field: ContractInstructionArgField, rawValue: string) {
  if (field.kind === "boolean") {
    return rawValue === "true";
  }
  if (field.kind === "number") {
    return rawValue.trim() === "" ? new BN(0) : new BN(rawValue.trim());
  }
  if (field.kind === "publicKey") {
    return new PublicKey(rawValue.trim());
  }
  if (field.kind === "enum") {
    const normalized = rawValue.trim() || field.enumValues?.[0] || "";
    const key = normalized.charAt(0).toLowerCase() + normalized.slice(1);
    return { [key]: {} };
  }
  if (field.kind === "array") {
    return rawValue
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return rawValue;
}

function normalizeAccountData(value: unknown): unknown {
  if (value instanceof PublicKey) {
    return value.toBase58();
  }
  if (value instanceof BN) {
    return (value as BN).toString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeAccountData);
  }
  if (value && typeof value === "object") {
    if (
      "toBase58" in (value as Record<string, unknown>) &&
      typeof (value as { toBase58?: () => string }).toBase58 === "function"
    ) {
      return (value as { toBase58: () => string }).toBase58();
    }
    if ("toString" in (value as Record<string, unknown>) && value?.constructor?.name === "BN") {
      return String(value);
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeAccountData(entry)]),
    );
  }
  return value;
}

async function getGovernanceConfig(program: Program) {
  const [configPda] = getGovernanceConfigPda();
  const config = await (
    program.account as Record<string, { fetchNullable?: (address: PublicKey) => Promise<unknown> }>
  ).governanceConfig.fetchNullable?.(configPda);
  return { configPda, config };
}

async function getStakingConfig(program: Program) {
  const [configPda] = getStakingConfigPda();
  const config = await (
    program.account as Record<string, { fetchNullable?: (address: PublicKey) => Promise<unknown> }>
  ).stakingConfig.fetchNullable?.(configPda);
  return { configPda, config };
}

async function getPrimaryPool(program: Program, poolAddress?: string) {
  const pools =
    (await (
      program.account as Record<
        string,
        { all?: () => Promise<Array<{ publicKey: PublicKey; account: Record<string, unknown> }>> }
      >
    ).poolState.all?.()) || [];
  const selected = poolAddress ? pools.find((entry) => entry.publicKey.toBase58() === poolAddress) : pools[0];
  return selected || null;
}

async function getPrimaryMarket(program: Program, marketAddress?: string) {
  const markets =
    (await (
      program.account as Record<
        string,
        { all?: () => Promise<Array<{ publicKey: PublicKey; account: Record<string, unknown> }>> }
      >
    ).lendingMarketConfig.all?.()) || [];
  const selected = marketAddress
    ? markets.find((entry) => entry.publicKey.toBase58() === marketAddress)
    : markets[0];
  return selected || null;
}

function getProgramCatalogEntry(programKey: ContractConsoleProgramKey) {
  return CONTRACT_PROGRAMS[programKey];
}

export function getContractProgramCatalog(): ContractConsoleProgramSummary[] {
  return (Object.values(CONTRACT_PROGRAMS) as CatalogEntry[]).map((entry) => ({
    key: entry.key,
    label: entry.label,
    shortDescription: entry.shortDescription,
    longDescription: entry.longDescription,
    programId: entry.programId.toBase58(),
    network: SOLANA_NETWORK,
    version: entry.idl.metadata?.version || "0.1.0",
    addressLoaded: Boolean(entry.idl.address),
    accountTypes: entry.idl.accounts?.map((account) => account.name) || [],
    instructionCount: entry.idl.instructions?.length || 0,
  }));
}

export function getDefaultSavedContractCalls(): ContractSavedCall[] {
  return [
    {
      id: "template-stake-tokens",
      label: "Stake Tokens Example",
      programKey: "staking",
      instructionName: "stakeTokens",
      mode: "friendly",
      argValues: { amount: "10", positionNonce: String(Date.now()) },
      accountOverrides: {},
      createdAt: new Date().toISOString(),
    },
    {
      id: "template-borrow-tokens",
      label: "Borrow Tokens Example",
      programKey: "lending",
      instructionName: "borrowTokens",
      mode: "friendly",
      argValues: { amount: "5" },
      accountOverrides: {},
      createdAt: new Date().toISOString(),
    },
    {
      id: "template-create-proposal",
      label: "Create Proposal Example",
      programKey: "governance",
      instructionName: "createProposal",
      mode: "friendly",
      argValues: {
        proposalId: "1",
        title: "Retix Treasury Diversification",
        metadataUri: "retix://proposal/treasury-diversification",
        startTime: String(Math.floor(Date.now() / 1000)),
        endTime: String(Math.floor(Date.now() / 1000) + 86_400),
      },
      accountOverrides: {},
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getInstructionSummaries(programKey: ContractConsoleProgramKey): ContractInstructionSummary[] {
  const program = getProgramCatalogEntry(programKey);
  return ((program.idl.instructions || []) as IdlInstructionLike[]).map((instruction) => {
    const args = (instruction.args || []).map((arg) => {
      const kind = getArgKind(arg.type, program.idl);
      const enumValues = getEnumValues(arg.type, program.idl);
      return {
        name: arg.name,
        label: startCase(arg.name),
        kind,
        rawType: getRawTypeLabel(arg.type),
        placeholder: getPlaceholder(kind, arg.name, enumValues),
        enumValues,
        required: true,
        helperText: kind === "publicKey" ? "Solana public key" : undefined,
      } satisfies ContractInstructionArgField;
    });
    const accounts = ((instruction.accounts || []) as Array<{ name: string; signer?: boolean; writable?: boolean }>).map((account) => ({
      name: account.name,
      label: startCase(account.name),
      signer: Boolean(account.signer),
      writable: Boolean(account.writable),
      required: true,
      helperText: account.signer ? "Wallet signature required" : undefined,
    }));
    const adminOnly =
      accounts.some((account) => DANGEROUS_ACCOUNT_NAMES.includes(account.name)) ||
      ADMIN_KEYWORDS.some((keyword) => instruction.name.toLowerCase().includes(keyword));
    const cautionLevel = CAUTION_KEYWORDS.some((keyword) => instruction.name.toLowerCase().includes(keyword))
      ? "danger"
      : adminOnly
        ? "warning"
        : "safe";

    return {
      name: instruction.name,
      label: startCase(instruction.name),
      description:
        INSTRUCTION_DESCRIPTIONS[instruction.name] ||
        "Anchor IDL instruction available for direct on-chain execution.",
      args,
      accounts,
      signerRequired: accounts.some((account) => account.signer),
      adminOnly,
      cautionLevel,
      requiredArgsCount: args.length,
    };
  });
}

export function getInitialArgValues(programKey: ContractConsoleProgramKey, instructionName: string) {
  const instruction = getInstructionSummaries(programKey).find((entry) => entry.name === instructionName);
  if (!instruction) {
    return {};
  }

  return Object.fromEntries(
    instruction.args.map((arg) => {
      if (arg.kind === "boolean") {
        return [arg.name, "false"];
      }
      if (arg.kind === "enum") {
        return [arg.name, arg.enumValues?.[0] || ""];
      }
      return [arg.name, ""];
    }),
  );
}

export function getDefaultInstructionForProgram(programKey: ContractConsoleProgramKey) {
  return getProgramCatalogEntry(programKey).defaultInstruction;
}

export function getPinnedInstructionKeys(programKey: ContractConsoleProgramKey) {
  return getProgramCatalogEntry(programKey).pinnedInstructions.map((instructionName) =>
    slugifyInstruction(programKey, instructionName),
  );
}

function getProgramInstance(programKey: ContractConsoleProgramKey, provider?: AnchorProvider) {
  return getProgramCatalogEntry(programKey).getProgram(provider);
}

export function buildInstructionBadge(programKey: ContractConsoleProgramKey, instructionName: string) {
  return slugifyInstruction(programKey, instructionName);
}

export function decodeContractConsoleError(error: unknown) {
  const normalized = normalizeSolanaError(error);
  if (/Borrow limit exceeded/i.test(normalized)) {
    return "Borrow limit exceeded for the current lending position.";
  }
  if (/Lock period/i.test(normalized)) {
    return "Lock period requirement was not satisfied for this staking action.";
  }
  if (/Unauthorized/i.test(normalized)) {
    return "Unauthorized admin action for the selected wallet.";
  }
  if (/custom program error/i.test(normalized)) {
    return "Anchor program returned a custom error. Review account state and logs.";
  }
  if (/Resolve required accounts/i.test(normalized)) {
    return normalized;
  }
  return normalized;
}

export function exportSavedContractCall(call: ContractSavedCall) {
  return JSON.stringify(call, null, 2);
}

async function resolveCommonAccount(name: string, context?: ProgramActionContext) {
  if (!context?.publicKey) {
    return undefined;
  }

  switch (name) {
    case "admin":
    case "owner":
    case "authority":
    case "proposer":
    case "voter":
    case "liquidator":
    case "payer":
      return context.publicKey.toBase58();
    case "systemProgram":
      return SystemProgram.programId.toBase58();
    case "tokenProgram":
      return TOKEN_PROGRAM_ID.toBase58();
    case "associatedTokenProgram":
      return ASSOCIATED_TOKEN_PROGRAM_ID.toBase58();
    case "rent":
      return SYSVAR_RENT_PUBKEY.toBase58();
    default:
      return undefined;
  }
}

async function resolveStakingAccounts(params: {
  argValues: Record<string, string>;
  resolved: Record<string, string>;
  context?: ProgramActionContext;
}) {
  const { context } = params;
  const program = getStakingProgram();
  const { configPda, config } = await getStakingConfig(program);
  params.resolved.config = params.resolved.config || configPda.toBase58();

  const durationCandidate =
    params.argValues.durationDays || params.argValues.lockPeriod || params.argValues.lockPeriodDays;
  if (durationCandidate && !params.resolved.lockPeriod) {
    params.resolved.lockPeriod = getLockPeriodPda(Number(durationCandidate))[0].toBase58();
  }

  const positionNonce = params.argValues.positionNonce;
  if (positionNonce && context?.publicKey && !params.resolved.position) {
    params.resolved.position = getStakePositionPda(context.publicKey, BigInt(positionNonce))[0].toBase58();
  }

  if (config) {
    const configRecord = config as Record<string, unknown>;
    const stakingMint = toPublicKeyString(configRecord.stakingMint);
    const rewardMint = toPublicKeyString(configRecord.rewardMint);
    params.resolved.stakingMint = params.resolved.stakingMint || stakingMint || "";
    params.resolved.rewardMint = params.resolved.rewardMint || rewardMint || "";
    params.resolved.treasuryVault = params.resolved.treasuryVault || toPublicKeyString(configRecord.treasuryVault) || "";
    params.resolved.rewardVault = params.resolved.rewardVault || toPublicKeyString(configRecord.rewardVault) || "";

    if (stakingMint && context?.publicKey && !params.resolved.userStakeAccount) {
      const account = await findOwnedTokenAccount(
        params.context!.connection,
        context.publicKey,
        new PublicKey(stakingMint),
      );
      if (account) {
        params.resolved.userStakeAccount = account.toBase58();
      }
    }
    if (rewardMint && context?.publicKey && !params.resolved.userRewardAccount) {
      const account = await findOwnedTokenAccount(
        params.context!.connection,
        context.publicKey,
        new PublicKey(rewardMint),
      );
      if (account) {
        params.resolved.userRewardAccount = account.toBase58();
      }
    }
  }

  return params.resolved;
}

async function resolveGovernanceAccounts(params: {
  argValues: Record<string, string>;
  resolved: Record<string, string>;
  context?: ProgramActionContext;
}) {
  const { context } = params;
  const program = getGovernanceProgram();
  const { configPda, config } = await getGovernanceConfig(program);
  params.resolved.config = params.resolved.config || configPda.toBase58();

  const proposalId = params.argValues.proposalId;
  if (proposalId && !params.resolved.proposal) {
    params.resolved.proposal = getProposalPda(BigInt(proposalId))[0].toBase58();
  }

  if (params.resolved.proposal && context?.publicKey && !params.resolved.voteRecord) {
    params.resolved.voteRecord = getVoteRecordPda(
      new PublicKey(params.resolved.proposal),
      context.publicKey,
    )[0].toBase58();
  }

  if (config) {
    const configRecord = config as Record<string, unknown>;
    const governanceMint = toPublicKeyString(configRecord.governanceMint);
    if (governanceMint) {
      params.resolved.governanceMint = params.resolved.governanceMint || governanceMint;
      if (context?.publicKey && !params.resolved.proposerGovernanceAccount) {
        const account = await findOwnedTokenAccount(
          params.context!.connection,
          context.publicKey,
          new PublicKey(governanceMint),
        );
        if (account) {
          params.resolved.proposerGovernanceAccount = account.toBase58();
        }
      }
      if (context?.publicKey && !params.resolved.voterGovernanceAccount) {
        const account = await findOwnedTokenAccount(
          params.context!.connection,
          context.publicKey,
          new PublicKey(governanceMint),
        );
        if (account) {
          params.resolved.voterGovernanceAccount = account.toBase58();
        }
      }
    }
  }

  return params.resolved;
}

async function resolveLiquidityAccounts(params: {
  argValues: Record<string, string>;
  resolved: Record<string, string>;
  context?: ProgramActionContext;
}) {
  const { context } = params;
  const program = getLiquidityProgram();
  let poolEntry = await getPrimaryPool(program, params.resolved.pool);

  const tokenAMint = params.resolved.tokenAMint || params.argValues.tokenAMint;
  const tokenBMint = params.resolved.tokenBMint || params.argValues.tokenBMint;
  if (!poolEntry && tokenAMint && tokenBMint) {
    try {
      const [poolPda] = getPoolPda(new PublicKey(tokenAMint), new PublicKey(tokenBMint));
      params.resolved.pool = params.resolved.pool || poolPda.toBase58();
      poolEntry = await getPrimaryPool(program, poolPda.toBase58());
    } catch {
      // initialization flow may be manual
    }
  }

  if (poolEntry) {
    params.resolved.pool = params.resolved.pool || poolEntry.publicKey.toBase58();
    const pool = poolEntry.account;
    const mintA = toPublicKeyString(pool.tokenAMint);
    const mintB = toPublicKeyString(pool.tokenBMint);
    const lpMint = toPublicKeyString(pool.lpMint);
    params.resolved.tokenAMint = params.resolved.tokenAMint || mintA || "";
    params.resolved.tokenBMint = params.resolved.tokenBMint || mintB || "";
    params.resolved.reserveAVault = params.resolved.reserveAVault || toPublicKeyString(pool.reserveAVault) || "";
    params.resolved.reserveBVault = params.resolved.reserveBVault || toPublicKeyString(pool.reserveBVault) || "";
    params.resolved.lpMint = params.resolved.lpMint || lpMint || "";

    if (context?.publicKey && !params.resolved.position) {
      params.resolved.position = getLiquidityPositionPda(
        poolEntry.publicKey,
        context.publicKey,
      )[0].toBase58();
    }

    if (mintA && context?.publicKey && !params.resolved.userTokenA) {
      const account = await findOwnedTokenAccount(
        params.context!.connection,
        context.publicKey,
        new PublicKey(mintA),
      );
      if (account) {
        params.resolved.userTokenA = account.toBase58();
      }
    }
    if (mintB && context?.publicKey && !params.resolved.userTokenB) {
      const account = await findOwnedTokenAccount(
        params.context!.connection,
        context.publicKey,
        new PublicKey(mintB),
      );
      if (account) {
        params.resolved.userTokenB = account.toBase58();
      }
    }
    if (lpMint && context?.publicKey && !params.resolved.userLpToken) {
      const account = await findOwnedTokenAccount(
        params.context!.connection,
        context.publicKey,
        new PublicKey(lpMint),
      );
      if (account) {
        params.resolved.userLpToken = account.toBase58();
      }
    }
    if (!params.resolved.userSourceToken) {
      if (params.argValues.aToB === "true" && params.resolved.userTokenA) {
        params.resolved.userSourceToken = params.resolved.userTokenA;
      } else if (params.resolved.userTokenB) {
        params.resolved.userSourceToken = params.resolved.userTokenB;
      }
    }
    if (!params.resolved.userDestinationToken) {
      if (params.argValues.aToB === "true" && params.resolved.userTokenB) {
        params.resolved.userDestinationToken = params.resolved.userTokenB;
      } else if (params.resolved.userTokenA) {
        params.resolved.userDestinationToken = params.resolved.userTokenA;
      }
    }
  }

  return params.resolved;
}

async function resolveLendingAccounts(params: {
  argValues: Record<string, string>;
  resolved: Record<string, string>;
  context?: ProgramActionContext;
}) {
  const { context } = params;
  const program = getLendingProgram();
  let marketEntry = await getPrimaryMarket(program, params.resolved.market);

  const collateralMint = params.resolved.collateralMint || params.argValues.collateralMint;
  const borrowMint = params.resolved.borrowMint || params.argValues.borrowMint;
  if (!marketEntry && collateralMint && borrowMint) {
    try {
      const [marketPda] = getLendingMarketPda(new PublicKey(collateralMint), new PublicKey(borrowMint));
      params.resolved.market = params.resolved.market || marketPda.toBase58();
      marketEntry = await getPrimaryMarket(program, marketPda.toBase58());
    } catch {
      // initialization flow may be manual
    }
  }

  if (marketEntry) {
    params.resolved.market = params.resolved.market || marketEntry.publicKey.toBase58();
    const market = marketEntry.account;
    const marketPk = marketEntry.publicKey;
    const marketCollateralMint = toPublicKeyString(market.collateralMint);
    const marketBorrowMint = toPublicKeyString(market.borrowMint);
    params.resolved.collateralMint = params.resolved.collateralMint || marketCollateralMint || "";
    params.resolved.borrowMint = params.resolved.borrowMint || marketBorrowMint || "";
    params.resolved.collateralVault = params.resolved.collateralVault || toPublicKeyString(market.collateralVault) || "";
    params.resolved.liquidityVault = params.resolved.liquidityVault || toPublicKeyString(market.liquidityVault) || "";
    if (context?.publicKey && !params.resolved.position) {
      params.resolved.position = getLendingPositionPda(marketPk, context.publicKey)[0].toBase58();
    }

    if (marketCollateralMint && context?.publicKey && !params.resolved.userCollateralAccount) {
      const account = await findOwnedTokenAccount(
        params.context!.connection,
        context.publicKey,
        new PublicKey(marketCollateralMint),
      );
      if (account) {
        params.resolved.userCollateralAccount = account.toBase58();
      }
    }
    if (marketBorrowMint && context?.publicKey && !params.resolved.userBorrowAccount) {
      const account = await findOwnedTokenAccount(
        params.context!.connection,
        context.publicKey,
        new PublicKey(marketBorrowMint),
      );
      if (account) {
        params.resolved.userBorrowAccount = account.toBase58();
      }
      if (account && !params.resolved.liquidatorRepayAccount) {
        params.resolved.liquidatorRepayAccount = account.toBase58();
      }
    }
    if (marketCollateralMint && context?.publicKey && !params.resolved.liquidatorCollateralAccount) {
      const account = await findOwnedTokenAccount(
        params.context!.connection,
        context.publicKey,
        new PublicKey(marketCollateralMint),
      );
      if (account) {
        params.resolved.liquidatorCollateralAccount = account.toBase58();
      }
    }
  }

  return params.resolved;
}

export async function resolveInstructionAccounts(params: {
  programKey: ContractConsoleProgramKey;
  instructionName: string;
  argValues: Record<string, string>;
  accountOverrides?: Record<string, string>;
  mode: ContractConsoleMode;
  context?: ProgramActionContext;
}): Promise<ContractResolvedAccount[]> {
  const instruction = getInstructionSummaries(params.programKey).find(
    (entry) => entry.name === params.instructionName,
  );
  if (!instruction) {
    return [];
  }

  const resolvedMap: Record<string, string> = {};

  for (const account of instruction.accounts) {
    const override = params.accountOverrides?.[account.name]?.trim();
    if (override) {
      resolvedMap[account.name] = override;
      continue;
    }
    const common = await resolveCommonAccount(account.name, params.context);
    if (common) {
      resolvedMap[account.name] = common;
    }
  }

  if (params.mode === "friendly") {
    if (params.programKey === "staking") {
      await resolveStakingAccounts({
        argValues: params.argValues,
        resolved: resolvedMap,
        context: params.context,
      });
    }
    if (params.programKey === "governance") {
      await resolveGovernanceAccounts({
        argValues: params.argValues,
        resolved: resolvedMap,
        context: params.context,
      });
    }
    if (params.programKey === "liquidity") {
      await resolveLiquidityAccounts({
        argValues: params.argValues,
        resolved: resolvedMap,
        context: params.context,
      });
    }
    if (params.programKey === "lending") {
      await resolveLendingAccounts({
        argValues: params.argValues,
        resolved: resolvedMap,
        context: params.context,
      });
    }
  }

  return instruction.accounts.map((account) => {
    const manualValue = params.accountOverrides?.[account.name]?.trim();
    const address = manualValue || resolvedMap[account.name];
    return {
      name: account.name,
      label: account.label,
      address,
      shortAddress: shortenAddress(address),
      signer: account.signer,
      writable: account.writable,
      source: manualValue
        ? "manual"
        : address
          ? ["systemProgram", "tokenProgram", "associatedTokenProgram", "rent"].includes(account.name)
            ? "default"
            : "derived"
          : "missing",
      editable: params.mode === "raw" || !address,
      note: address
        ? manualValue
          ? "Manually overridden"
          : "Auto-resolved from wallet context and program PDAs"
        : "Manual input required",
    } satisfies ContractResolvedAccount;
  });
}

function buildAccountsObject(accounts: ContractResolvedAccount[]) {
  const missing = accounts.filter((account) => !account.address);
  if (missing.length) {
    throw new Error(
      `Resolve required accounts before continuing: ${missing.map((account) => account.label).join(", ")}`,
    );
  }

  return Object.fromEntries(accounts.map((account) => [account.name, new PublicKey(account.address!)]));
}

function buildArgValues(
  programKey: ContractConsoleProgramKey,
  instructionName: string,
  argValues: Record<string, string>,
) {
  const instruction = getInstructionSummaries(programKey).find((entry) => entry.name === instructionName);
  if (!instruction) {
    return [];
  }

  return instruction.args.map((field) => deserializeUiValue(field, argValues[field.name] || ""));
}

async function buildMethodAndTransaction(params: {
  programKey: ContractConsoleProgramKey;
  instructionName: string;
  argValues: Record<string, string>;
  resolvedAccounts: ContractResolvedAccount[];
  context: ProgramActionContext;
}) {
  const provider = createProgramProvider(params.context);
  const program = getProgramInstance(params.programKey, provider);
  const args = buildArgValues(params.programKey, params.instructionName, params.argValues);
  const methodFactory = (
    program.methods as Record<
      string,
      (...args: unknown[]) => {
        accountsStrict: (
          accounts: Record<string, PublicKey>,
        ) => { transaction: () => Promise<Transaction>; rpc: () => Promise<string> };
      }
    >
  )[params.instructionName];
  if (!methodFactory) {
    throw new Error("Selected instruction is not available in the loaded Anchor IDL.");
  }

  const builder = methodFactory(...args).accountsStrict(buildAccountsObject(params.resolvedAccounts));
  const transaction = await builder.transaction();
  const latestBlockhash = await params.context.connection.getLatestBlockhash(DEFAULT_COMMITMENT);
  transaction.feePayer = params.context.publicKey!;
  transaction.recentBlockhash = latestBlockhash.blockhash;
  const feeResult = await params.context.connection.getFeeForMessage(
    transaction.compileMessage(),
    DEFAULT_COMMITMENT,
  );

  return {
    builder,
    transaction,
    estimatedFeeLamports: feeResult.value || 0,
  };
}

export async function buildContractPreview(params: {
  programKey: ContractConsoleProgramKey;
  instructionName: string;
  argValues: Record<string, string>;
  resolvedAccounts: ContractResolvedAccount[];
  context?: ProgramActionContext;
}): Promise<ContractPreviewSummary> {
  if (!params.context?.publicKey) {
    return {
      estimatedFeeLamports: 0,
      resolvedAccounts: params.resolvedAccounts,
      unresolvedCount: params.resolvedAccounts.filter((account) => !account.address).length,
      signerWallet: null,
    };
  }

  try {
    const preview = await buildMethodAndTransaction({
      ...params,
      context: params.context,
    });
    return {
      estimatedFeeLamports: preview.estimatedFeeLamports,
      resolvedAccounts: params.resolvedAccounts,
      unresolvedCount: params.resolvedAccounts.filter((account) => !account.address).length,
      signerWallet: params.context.publicKey.toBase58(),
    };
  } catch {
    return {
      estimatedFeeLamports: 0,
      resolvedAccounts: params.resolvedAccounts,
      unresolvedCount: params.resolvedAccounts.filter((account) => !account.address).length,
      signerWallet: params.context.publicKey.toBase58(),
    };
  }
}

export async function simulateContractInstruction(params: {
  programKey: ContractConsoleProgramKey;
  instructionName: string;
  argValues: Record<string, string>;
  resolvedAccounts: ContractResolvedAccount[];
  context: ProgramActionContext;
}): Promise<ContractSimulationResult> {
  const method = await buildMethodAndTransaction(params);
  const signed = await params.context.anchorWallet!.signTransaction(method.transaction);
  const simulation = await params.context.connection.simulateTransaction(signed);

  if (simulation.value.err) {
    return {
      success: false,
      estimatedFeeLamports: method.estimatedFeeLamports,
      logs: simulation.value.logs || [],
      unitsConsumed: simulation.value.unitsConsumed,
      error: decodeContractConsoleError(simulation.value.err),
    };
  }

  return {
    success: true,
    estimatedFeeLamports: method.estimatedFeeLamports,
    logs: simulation.value.logs || [],
    unitsConsumed: simulation.value.unitsConsumed,
  };
}

function buildExecutionOutputs(resolvedAccounts: ContractResolvedAccount[]) {
  const importantNames = ["position", "proposal", "voteRecord", "pool", "market", "config", "lockPeriod"];
  return resolvedAccounts
    .filter((account) => account.address && importantNames.includes(account.name))
    .map((account) => ({
      label: account.label,
      value: account.address!,
      explorerUrl: buildExplorerAddressUrl(account.address!),
    }));
}

export async function executeContractInstruction(params: {
  programKey: ContractConsoleProgramKey;
  instructionName: string;
  argValues: Record<string, string>;
  resolvedAccounts: ContractResolvedAccount[];
  context: ProgramActionContext;
}): Promise<ContractExecutionResult> {
  const method = await buildMethodAndTransaction(params);
  const signature = await method.builder.rpc();
  const parsed = await params.context.connection.getTransaction(signature, {
    commitment: DEFAULT_COMMITMENT,
    maxSupportedTransactionVersion: 0,
  });

  return {
    signature,
    explorerUrl: buildExplorerUrl(signature),
    status: "confirmed",
    slot: parsed?.slot,
    blockTime: parsed?.blockTime ? new Date(parsed.blockTime * 1000).toLocaleString() : null,
    logs: parsed?.meta?.logMessages || [],
    unitsConsumed: parsed?.meta?.computeUnitsConsumed,
    outputs: buildExecutionOutputs(params.resolvedAccounts),
  };
}

export async function readProgramAccountState(params: {
  programKey: ContractConsoleProgramKey;
  accountType: string;
  address: string;
}) {
  const entry = getProgramCatalogEntry(params.programKey);
  const program = entry.getProgram();
  const info = await program.provider.connection.getAccountInfo(
    new PublicKey(params.address),
    DEFAULT_COMMITMENT,
  );
  if (!info) {
    throw new Error("Account not found on Solana Devnet.");
  }

  const decoded = (
    program.coder.accounts as { decode: (name: string, data: Buffer) => unknown }
  ).decode(params.accountType, info.data);

  return {
    address: params.address,
    accountType: params.accountType,
    explorerUrl: buildExplorerAddressUrl(params.address),
    decoded: normalizeAccountData(decoded) as Record<string, unknown>,
    lamports: info.lamports,
    owner: info.owner.toBase58(),
    executable: info.executable,
  } satisfies ContractAccountState;
}

export function getIdlInspectorData(programKey: ContractConsoleProgramKey) {
  const entry = getProgramCatalogEntry(programKey);
  return {
    name: entry.idl.metadata?.name || entry.label,
    version: entry.idl.metadata?.version || "0.1.0",
    description: entry.idl.metadata?.description || entry.longDescription,
    programId: entry.programId.toBase58(),
    instructions: getInstructionSummaries(programKey),
    accounts: entry.idl.accounts?.map((account) => account.name) || [],
    types:
      entry.idl.types?.map((typeEntry) => ({
        name: typeEntry.name,
        kind: typeEntry.type?.kind || "struct",
        variants:
          ((typeEntry.type as { variants?: Array<{ name: string }> } | undefined)?.variants || []).map(
            (variant) => variant.name,
          ),
      })) || [],
  };
}
