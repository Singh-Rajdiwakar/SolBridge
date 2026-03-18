import { GovernanceMetadata } from "../models/GovernanceMetadata.js";
import { AppError } from "../utils/app-error.js";

export async function getGovernanceMetadata(proposalPubkey) {
  const metadata = await GovernanceMetadata.findOne({ proposalPubkey });
  if (!metadata) {
    throw new AppError("Governance metadata not found", 404);
  }

  return {
    ...metadata.toObject(),
    source: "off-chain-metadata",
  };
}

export async function createGovernanceMetadata(payload) {
  const metadata = await GovernanceMetadata.findOneAndUpdate(
    { proposalPubkey: payload.proposalPubkey },
    payload,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  return {
    ...metadata.toObject(),
    source: "off-chain-metadata",
  };
}

export async function updateGovernanceMetadata(proposalPubkey, payload) {
  const metadata = await GovernanceMetadata.findOneAndUpdate(
    { proposalPubkey },
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!metadata) {
    throw new AppError("Governance metadata not found", 404);
  }

  return {
    ...metadata.toObject(),
    source: "off-chain-metadata",
  };
}
