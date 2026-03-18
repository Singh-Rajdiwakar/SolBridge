import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

import { getGovernanceProgram } from "@/lib/solana/programs/governanceProgram";
import { getGovernanceConfigPda, getProposalPda, getVoteRecordPda } from "@/lib/solana/pda";
import type {
  OnChainActionResult,
  OnChainGovernanceConfig,
  OnChainGovernanceSummary,
} from "@/types";
import {
  buildConfirmedActionResult,
  buildProgramStatus,
  createProgramProvider,
  findOwnedTokenAccount,
  normalizeActionError,
  parseEnumVariant,
  ProgramActionContext,
  requireProgramContext,
  toNumber,
  toPublicKeyString,
} from "@/services/programs/shared";
import { buildExplorerAddressUrl } from "@/lib/solana";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

function voteTypeToAnchor(voteType: string) {
  switch (voteType.toLowerCase()) {
    case "yes":
      return { yes: {} };
    case "no":
      return { no: {} };
    default:
      return { abstain: {} };
  }
}

export async function fetchGovernanceConfig(): Promise<OnChainGovernanceConfig> {
  const [configPda] = getGovernanceConfigPda();
  const program = getGovernanceProgram();
  const programStatus = await buildProgramStatus({
    module: "governance",
    label: "Governance Program",
    programId: program.programId,
    configAddress: configPda.toBase58(),
    notes: [
      "Proposal state and vote records are fetched from Solana PDA accounts.",
      "Proposal creation, voting, finalization, and cancellation require signed Anchor transactions.",
    ],
  });

  if (!programStatus.deployed) {
    return {
      program: programStatus,
      quorumBps: 0,
      votingDurationSeconds: 0,
    };
  }

  const config = await program.account.governanceConfig.fetchNullable(configPda);
  if (!config) {
    return {
      program: programStatus,
      quorumBps: 0,
      votingDurationSeconds: 0,
    };
  }

  return {
    program: programStatus,
    admin: toPublicKeyString(config.admin),
    governanceMint: toPublicKeyString(config.governanceMint),
    quorumBps: toNumber(config.quorumBps),
    votingDurationSeconds: toNumber(config.votingDurationSeconds),
    proposalThreshold: toNumber(config.proposalThreshold),
  };
}

export async function fetchProposals(): Promise<OnChainGovernanceSummary[]> {
  const config = await fetchGovernanceConfig();
  if (!config.program.deployed) {
    return [];
  }

  const program = getGovernanceProgram();
  const proposals = await program.account.proposal.all().catch(() => []);
  return proposals
    .map((entry: { publicKey: PublicKey; account: Record<string, unknown> }) => {
      const account = entry.account as Record<string, unknown>;
      return {
        address: entry.publicKey.toBase58(),
        explorerUrl: buildExplorerAddressUrl(entry.publicKey.toBase58()),
        proposalId: toNumber(account.proposalId),
        proposer: toPublicKeyString(account.proposer),
        metadataUri: String(account.metadataUri || ""),
        title: String(account.title || "Proposal"),
        status: parseEnumVariant(account.status).toLowerCase(),
        yesVotes: toNumber(account.votesYes),
        noVotes: toNumber(account.votesNo),
        abstainVotes: toNumber(account.votesAbstain),
        startTime: toNumber(account.startTime),
        endTime: toNumber(account.endTime),
        source: "on-chain" as const,
      };
    })
    .sort(
      (left: OnChainGovernanceSummary, right: OnChainGovernanceSummary) =>
        (right.proposalId || 0) - (left.proposalId || 0),
    );
}

export async function fetchProposal(proposalPda: string) {
  const proposals = await fetchProposals();
  return proposals.find((proposal) => proposal.address === proposalPda) || null;
}

export async function fetchUserVoteRecord(proposalPda: string, walletAddress?: string | null) {
  if (!walletAddress) {
    return null;
  }

  const voter = new PublicKey(walletAddress);
  const proposal = new PublicKey(proposalPda);
  const [voteRecordPda] = getVoteRecordPda(proposal, voter);
  const program = getGovernanceProgram();
  const voteRecord = await program.account.voteRecord.fetchNullable(voteRecordPda);
  if (!voteRecord) {
    return null;
  }

  return {
    address: voteRecordPda.toBase58(),
    explorerUrl: buildExplorerAddressUrl(voteRecordPda.toBase58()),
    voter: toPublicKeyString(voteRecord.voter),
    votingPower: toNumber(voteRecord.votingPower),
    voteType: parseEnumVariant(voteRecord.voteType).toLowerCase(),
  };
}

export async function createProposal(
  payload: {
    title: string;
    descriptionHash?: string;
    metadataUri?: string;
    startDate?: string;
    endDate?: string;
    startsAt?: string | number | Date;
    endsAt?: string | number | Date;
  },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getGovernanceProgram(provider);
    const [configPda] = getGovernanceConfigPda();
    const config = await program.account.governanceConfig.fetchNullable(configPda);
    if (!config) {
      throw new Error("Governance config PDA is not deployed on Devnet.");
    }

    const governanceMint = new PublicKey(toPublicKeyString(config.governanceMint)!);
    const proposerGovernanceAccount = await findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, governanceMint);
    if (!proposerGovernanceAccount) {
      throw new Error("Connected wallet does not hold a governance token account.");
    }

    const existing = await program.account.proposal.all().catch(() => []);
    const proposalId =
      existing.reduce(
        (max: number, entry: { publicKey: PublicKey; account: Record<string, unknown> }) =>
          Math.max(max, toNumber(entry.account.proposalId)),
        0,
      ) + 1;
    const [proposalPda] = getProposalPda(proposalId);
    const startTime = Math.floor(new Date((payload.startsAt || payload.startDate || Date.now()) as string | number | Date).getTime() / 1000);
    const endTime = Math.floor(new Date((payload.endsAt || payload.endDate || Date.now()) as string | number | Date).getTime() / 1000);
    const metadataUri = payload.metadataUri || payload.descriptionHash || `retix://proposal/${proposalId}`;

    const signature = await program.methods
      .createProposal(
        new BN(proposalId),
        payload.title,
        metadataUri,
        new BN(startTime),
        new BN(endTime),
      )
      .accountsStrict({
        config: configPda,
        proposal: proposalPda,
        proposer: safeContext.publicKey,
        proposerGovernanceAccount,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return buildConfirmedActionResult("Create Proposal", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function castVote(
  payload: { proposal: string; voteType: "yes" | "no" | "abstain" | string },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getGovernanceProgram(provider);
    const [configPda] = getGovernanceConfigPda();
    const config = await program.account.governanceConfig.fetchNullable(configPda);
    if (!config) {
      throw new Error("Governance config PDA is not deployed on Devnet.");
    }

    const proposalPublicKey = new PublicKey(payload.proposal);
    const governanceMint = new PublicKey(toPublicKeyString(config.governanceMint)!);
    const voterGovernanceAccount = await findOwnedTokenAccount(safeContext.connection, safeContext.publicKey, governanceMint);
    if (!voterGovernanceAccount) {
      throw new Error("Connected wallet does not have a governance token account.");
    }

    const [voteRecordPda] = getVoteRecordPda(proposalPublicKey, safeContext.publicKey);
    const signature = await program.methods
      .castVote(voteTypeToAnchor(payload.voteType))
      .accountsStrict({
        config: configPda,
        proposal: proposalPublicKey,
        voteRecord: voteRecordPda,
        voter: safeContext.publicKey,
        voterGovernanceAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return buildConfirmedActionResult("Cast Vote", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function finalizeProposal(proposalPda: string, context?: ProgramActionContext): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getGovernanceProgram(provider);
    const [configPda] = getGovernanceConfigPda();
    const config = await program.account.governanceConfig.fetchNullable(configPda);
    if (!config) {
      throw new Error("Governance config PDA is not deployed on Devnet.");
    }

    const signature = await program.methods
      .finalizeProposal()
      .accountsStrict({
        config: configPda,
        proposal: new PublicKey(proposalPda),
        governanceMint: new PublicKey(toPublicKeyString(config.governanceMint)!),
      })
      .rpc();

    return buildConfirmedActionResult("Finalize Proposal", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function cancelProposal(proposalPda: string, context?: ProgramActionContext): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getGovernanceProgram(provider);
    const [configPda] = getGovernanceConfigPda();
    const signature = await program.methods
      .cancelProposal()
      .accountsStrict({
        config: configPda,
        proposal: new PublicKey(proposalPda),
        authority: safeContext.publicKey,
      })
      .rpc();

    return buildConfirmedActionResult("Cancel Proposal", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}

export async function updateGovernanceConfig(
  payload: { quorumBps: number; votingDurationSeconds: number; proposalThreshold: number },
  context?: ProgramActionContext,
): Promise<OnChainActionResult> {
  try {
    const safeContext = requireProgramContext(context);
    const provider = createProgramProvider(safeContext);
    const program = getGovernanceProgram(provider);
    const [configPda] = getGovernanceConfigPda();
    const signature = await program.methods
      .updateGovernanceConfig(
        new BN(payload.quorumBps),
        new BN(payload.votingDurationSeconds),
        new BN(payload.proposalThreshold),
      )
      .accountsStrict({
        config: configPda,
        admin: safeContext.publicKey,
      })
      .rpc();
    return buildConfirmedActionResult("Update Governance Config", signature);
  } catch (error) {
    throw normalizeActionError(error);
  }
}
