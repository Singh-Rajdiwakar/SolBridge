import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { addWatchlistItem, getWatchlistByUserId, removeWatchlistItem } from "./watchlist.service.js";

function sanitizeUserProfile(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    walletAddress: user.walletAddress,
    preferredNetwork: user.preferredNetwork,
    linkedWallets: user.linkedWallets || [],
    preferences: user.preferences || {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getExistingUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

export async function findUserByWalletAddress(walletAddress) {
  const user = await User.findOne({
    $or: [{ walletAddress }, { "linkedWallets.address": walletAddress }],
  });

  if (!user) {
    throw new AppError("User not found for wallet", 404);
  }

  return user;
}

export async function getUserProfile(userId) {
  const user = await getExistingUser(userId);
  return sanitizeUserProfile(user);
}

export async function getUserPreferences(userId) {
  const user = await getExistingUser(userId);
  return {
    userId: user._id,
    preferences: user.preferences || {},
    preferredNetwork: user.preferredNetwork || "devnet",
  };
}

export async function updateUserProfile(userId, payload) {
  const user = await getExistingUser(userId);
  if (payload.name !== undefined) {
    user.name = payload.name;
  }
  if (payload.avatar !== undefined) {
    user.avatar = payload.avatar;
  }
  if (payload.preferredNetwork !== undefined) {
    user.preferredNetwork = payload.preferredNetwork;
  }
  await user.save();
  return sanitizeUserProfile(user);
}

export async function updateUserPreferences(userId, payload) {
  const user = await getExistingUser(userId);
  user.preferences = {
    ...(user.preferences || {}),
    ...payload,
  };
  await user.save();

  return getUserPreferences(userId);
}

export async function listUserWatchlist(userId) {
  return getWatchlistByUserId(userId);
}

export async function addUserWatchlistItem(userId, payload) {
  return addWatchlistItem(userId, {
    symbol: payload.symbol,
    coinId: payload.coinId,
  });
}

export async function removeUserWatchlistItem(userId, symbol) {
  return removeWatchlistItem(userId, symbol);
}

export async function linkUserWallet(userId, payload) {
  const user = await getExistingUser(userId);
  const existingIndex = (user.linkedWallets || []).findIndex((wallet) => wallet.address === payload.address);

  if (existingIndex >= 0) {
    user.linkedWallets[existingIndex] = {
      ...user.linkedWallets[existingIndex],
      provider: payload.provider,
      label: payload.label ?? user.linkedWallets[existingIndex].label,
      notes: payload.notes ?? user.linkedWallets[existingIndex].notes,
      favorite: payload.favorite ?? user.linkedWallets[existingIndex].favorite,
      isPrimary: payload.isPrimary ?? user.linkedWallets[existingIndex].isPrimary,
      lastUsedAt: new Date(),
    };
  } else {
    user.linkedWallets.push({
      address: payload.address,
      provider: payload.provider,
      label: payload.label || "",
      notes: payload.notes || "",
      favorite: Boolean(payload.favorite),
      isPrimary: Boolean(payload.isPrimary),
      lastUsedAt: new Date(),
      addedAt: new Date(),
    });
  }

  if (payload.isPrimary) {
    user.linkedWallets = user.linkedWallets.map((wallet) => ({
      ...wallet,
      isPrimary: wallet.address === payload.address,
    }));
    user.walletAddress = payload.address;
  }

  await user.save();
  return sanitizeUserProfile(user);
}
