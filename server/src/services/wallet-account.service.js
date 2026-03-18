import { Wallet } from "../models/Wallet.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import {
  encryptWalletSecret,
  generateWalletSecret,
  getPublicKeyFromPrivateKey,
} from "./solana.service.js";
import { logger } from "../utils/logger.js";

async function syncPrimaryLinkedWallet(userId, publicKey, provider) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const providerValue = provider.toLowerCase();
  const remainingWallets = (user.linkedWallets || []).filter((wallet) => wallet.address !== publicKey);
  const normalizedWallets = remainingWallets.map((wallet) => ({
    address: wallet.address,
    provider: wallet.provider,
    isPrimary: false,
    addedAt: wallet.addedAt,
  }));

  normalizedWallets.unshift({
    address: publicKey,
    provider: providerValue,
    isPrimary: true,
    addedAt: new Date(),
  });

  user.walletAddress = publicKey;
  user.linkedWallets = normalizedWallets;
  await user.save();
}

function sanitizeWallet(wallet) {
  if (!wallet) {
    return null;
  }

  return {
    _id: wallet._id,
    userId: wallet.userId,
    publicKey: wallet.publicKey,
    provider: wallet.provider,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}

export async function getWalletAccountByUserId(userId, includeSecret = false) {
  const query = Wallet.findOne({ userId });
  if (includeSecret) {
    query.select("+encryptedPrivateKey");
  }
  return query;
}

export async function ensureWalletAccount(userId, provider = "Retix Wallet") {
  const existing = await getWalletAccountByUserId(userId);
  if (existing) {
    return sanitizeWallet(existing);
  }

  const generated = generateWalletSecret();
  const wallet = await Wallet.create({
    userId,
    publicKey: generated.publicKey,
    encryptedPrivateKey: generated.encryptedPrivateKey,
    provider,
  });

  await syncPrimaryLinkedWallet(userId, generated.publicKey, provider);

  logger.info("wallet.account.created", {
    userId: String(userId),
    publicKey: generated.publicKey,
    provider,
  });

  return sanitizeWallet(wallet);
}

export async function createWalletAccount(userId, provider = "Retix Wallet") {
  const existing = await getWalletAccountByUserId(userId);
  if (existing) {
    throw new AppError("Wallet account already exists for this user", 409);
  }

  return ensureWalletAccount(userId, provider);
}

export async function importWalletAccount(userId, privateKey, provider = "Retix Wallet") {
  const publicKey = getPublicKeyFromPrivateKey(privateKey);
  const encryptedPrivateKey = encryptWalletSecret(privateKey);

  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    {
      userId,
      publicKey,
      encryptedPrivateKey,
      provider,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
      fields: { encryptedPrivateKey: 0 },
    },
  );

  await syncPrimaryLinkedWallet(userId, publicKey, provider);

  logger.info("wallet.account.imported", {
    userId: String(userId),
    publicKey,
    provider,
  });

  return sanitizeWallet(wallet);
}
