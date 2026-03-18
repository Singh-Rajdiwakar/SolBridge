import { Proposal } from "../models/Proposal.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { Vote } from "../models/Vote.js";
import { AppError } from "../utils/app-error.js";
import { adjustUserBalance, getUserBalance } from "../utils/balances.js";
import { calculateVoteParticipation } from "../utils/tokens.js";

function resolveProposalStatus(proposal) {
  const now = Date.now();
  if (proposal.status === "archived") {
    return "archived";
  }
  if (new Date(proposal.startDate).getTime() > now) {
    return "pending";
  }
  if (new Date(proposal.endDate).getTime() > now) {
    return "active";
  }
  const totalVotes = proposal.votesYes + proposal.votesNo + proposal.votesAbstain;
  return totalVotes >= proposal.quorum && proposal.votesYes > proposal.votesNo ? "passed" : "rejected";
}

async function getTotalVotingPower() {
  const users = await User.find();
  return users.reduce((sum, user) => sum + getUserBalance(user, "GOV"), 0);
}

async function enrichProposal(proposal) {
  const totalVotingPower = await getTotalVotingPower();
  const participation = calculateVoteParticipation(proposal, totalVotingPower);
  return {
    ...proposal.toObject(),
    status: resolveProposalStatus(proposal),
    participation: Number(participation.toFixed(2)),
  };
}

export async function getGovernanceStats(userId) {
  const [user, proposals, votes, totalVotingPower] = await Promise.all([
    User.findById(userId),
    Proposal.find(),
    Vote.countDocuments(),
    getTotalVotingPower(),
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const activeProposals = proposals.filter((proposal) => resolveProposalStatus(proposal) === "active").length;
  const userVotingPower = getUserBalance(user, "GOV");
  const treasuryParticipation =
    proposals.length === 0
      ? 0
      : proposals.reduce((sum, proposal) => sum + calculateVoteParticipation(proposal, totalVotingPower), 0) /
        proposals.length;

  return {
    activeProposals,
    totalVotesCast: votes,
    yourVotingPower: userVotingPower,
    treasuryParticipation: Number(treasuryParticipation.toFixed(2)),
  };
}

export async function listProposals(status) {
  const proposals = await Proposal.find().populate("proposerId", "name").sort({ createdAt: -1 });
  const enriched = await Promise.all(proposals.map((proposal) => enrichProposal(proposal)));
  return status ? enriched.filter((proposal) => proposal.status === status) : enriched;
}

export async function getProposalById(id) {
  const proposal = await Proposal.findById(id).populate("proposerId", "name");
  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }
  return enrichProposal(proposal);
}

export async function createProposal(user, payload) {
  const votingPower = getUserBalance(user, "GOV");
  if (user.role !== "admin" && votingPower < 1000) {
    throw new AppError("You need at least 1,000 GOV to create a proposal", 403);
  }

  const proposal = await Proposal.create({
    ...payload,
    proposerId: user._id,
  });

  return getProposalById(proposal._id);
}

export async function submitVote(userId, { proposalId, voteType }) {
  const [user, proposal] = await Promise.all([User.findById(userId), Proposal.findById(proposalId)]);

  if (!user || !proposal) {
    throw new AppError("Proposal or user not found", 404);
  }

  if (resolveProposalStatus(proposal) !== "active") {
    throw new AppError("Voting is closed for this proposal", 400);
  }

  const existingVote = await Vote.findOne({ proposalId, userId });
  if (existingVote) {
    throw new AppError("You have already voted on this proposal", 400);
  }

  const votingPower = getUserBalance(user, "GOV");
  if (votingPower <= 0) {
    throw new AppError("No voting power available", 400);
  }

  if (voteType === "yes") {
    proposal.votesYes += votingPower;
  } else if (voteType === "no") {
    proposal.votesNo += votingPower;
  } else {
    proposal.votesAbstain += votingPower;
  }

  await Promise.all([
    proposal.save(),
    Vote.create({
      proposalId,
      userId,
      voteType,
      votingPower,
      reward: Number((votingPower * 0.01).toFixed(2)),
    }),
  ]);

  return getProposalById(proposalId);
}

export async function getMyVotes(userId) {
  return Vote.find({ userId })
    .populate("proposalId", "title status")
    .sort({ createdAt: -1 })
    .lean()
    .then((votes) =>
      votes.map((vote) => ({
        ...vote,
        reward: vote.reward || 0,
      })),
    );
}

export async function getVestingDetails(userId) {
  const [user, votes] = await Promise.all([User.findById(userId), Vote.find({ userId })]);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const lockedGovernanceTokens = Number((getUserBalance(user, "GOV") * 0.72).toFixed(2));
  const claimableGovernanceRewards = votes.reduce((sum, vote) => sum + (vote.reward || 0), 0);

  return {
    lockedGovernanceTokens,
    vestingDuration: 180,
    currentVotingPower: getUserBalance(user, "GOV"),
    delegatedPower: Number((getUserBalance(user, "GOV") * 0.08).toFixed(2)),
    claimableGovernanceRewards: Number(claimableGovernanceRewards.toFixed(2)),
  };
}

export async function claimGovernanceRewards(userId) {
  const [user, votes] = await Promise.all([User.findById(userId), Vote.find({ userId })]);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const claimable = votes.reduce((sum, vote) => sum + (vote.reward || 0), 0);
  if (claimable <= 0) {
    throw new AppError("No governance rewards available", 400);
  }

  adjustUserBalance(user, "GOV", claimable);
  await user.save();

  await Promise.all(
    votes.map((vote) => {
      vote.reward = 0;
      return vote.save();
    }),
  );

  await Transaction.create({
    userId,
    type: "Governance Claim",
    token: "GOV",
    amount: claimable,
    status: "completed",
  });

  return { claimed: Number(claimable.toFixed(2)) };
}
