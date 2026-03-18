import bcrypt from "bcryptjs";

import { User } from "../models/User.js";
import { signToken } from "../utils/auth.js";
import { getTokenPrice } from "../utils/tokens.js";
import { AppError } from "../utils/app-error.js";
import { parsePublicKey } from "./solana.service.js";
import { ensureWalletAccount } from "./wallet-account.service.js";

function makeDefaultBalances() {
  return [
    { token: "SOL", amount: 12, fiatValue: Number((12 * getTokenPrice("SOL")).toFixed(2)) },
    { token: "USDC", amount: 4000, fiatValue: 4000 },
    { token: "GOV", amount: 250, fiatValue: Number((250 * getTokenPrice("GOV")).toFixed(2)) },
    { token: "RTX", amount: 2500, fiatValue: Number((2500 * getTokenPrice("RTX")).toFixed(2)) },
  ];
}

export function serializeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    walletAddress: user.walletAddress,
    avatar: user.avatar,
    linkedWallets: (user.linkedWallets || []).map((wallet) => ({
      address: wallet.address,
      provider: wallet.provider,
      label: wallet.label,
      notes: wallet.notes,
      favorite: wallet.favorite,
      isPrimary: wallet.isPrimary,
      lastUsedAt: wallet.lastUsedAt,
      addedAt: wallet.addedAt,
    })),
    preferredNetwork: user.preferredNetwork,
    preferences: user.preferences,
    balances: user.balances.map((balance) => ({
      token: balance.token,
      amount: balance.amount,
      fiatValue:
        balance.fiatValue ||
        Number((balance.amount * getTokenPrice(balance.token)).toFixed(2)),
    })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isValidWalletAddress(value) {
  if (!value) {
    return false;
  }

  try {
    parsePublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function normalizeLinkedWallets(linkedWallets, primaryAddress) {
  const deduped = new Map();

  for (const wallet of linkedWallets || []) {
    if (!wallet?.address || !isValidWalletAddress(wallet.address)) {
      continue;
    }

    if (!deduped.has(wallet.address)) {
      deduped.set(wallet.address, {
        address: wallet.address,
        provider: (wallet.provider || "retix").toLowerCase(),
        label: wallet.label || "",
        notes: wallet.notes || "",
        favorite: Boolean(wallet.favorite),
        isPrimary: wallet.address === primaryAddress,
        lastUsedAt: wallet.lastUsedAt || null,
        addedAt: wallet.addedAt || new Date(),
      });
    }
  }

  if (primaryAddress && !deduped.has(primaryAddress)) {
    deduped.set(primaryAddress, {
      address: primaryAddress,
      provider: "retix",
      label: "",
      notes: "",
      favorite: false,
      isPrimary: true,
      lastUsedAt: null,
      addedAt: new Date(),
    });
  }

  return Array.from(deduped.values()).map((wallet) => ({
    ...wallet,
    isPrimary: wallet.address === primaryAddress,
  }));
}

export async function ensureUserWalletIdentity(user) {
  let hydratedUser = user;
  let changed = false;

  const validLinkedWallets = (hydratedUser.linkedWallets || []).filter((wallet) => isValidWalletAddress(wallet.address));
  const primaryLinkedWallet =
    validLinkedWallets.find((wallet) => wallet.isPrimary) || validLinkedWallets[0] || null;

  if (!isValidWalletAddress(hydratedUser.walletAddress)) {
    if (primaryLinkedWallet) {
      hydratedUser.walletAddress = primaryLinkedWallet.address;
      changed = true;
    } else {
      await ensureWalletAccount(hydratedUser._id);
      hydratedUser = await User.findById(hydratedUser._id).select("+password");
      return hydratedUser;
    }
  }

  const normalizedLinkedWallets = normalizeLinkedWallets(hydratedUser.linkedWallets || [], hydratedUser.walletAddress);
  if (JSON.stringify(normalizedLinkedWallets) !== JSON.stringify(hydratedUser.linkedWallets || [])) {
    hydratedUser.linkedWallets = normalizedLinkedWallets;
    changed = true;
  }

  if (changed) {
    await hydratedUser.save();
  }

  return hydratedUser;
}

export async function registerUser(payload) {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new AppError("Email is already registered", 400);
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const user = await User.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: hashedPassword,
    walletAddress: payload.walletAddress || `pending-${Date.now()}`,
    linkedWallets: payload.walletAddress
      ? [
          {
            address: payload.walletAddress,
            provider: payload.provider || "retix",
            isPrimary: true,
          },
        ]
      : [],
    balances: makeDefaultBalances(),
  });

  const walletAccount = await ensureWalletAccount(user._id);
  if (!payload.walletAddress) {
    user.walletAddress = walletAccount.publicKey;
    user.linkedWallets = [
      {
        address: walletAccount.publicKey,
        provider: (payload.provider || "retix").toLowerCase(),
        isPrimary: true,
      },
    ];
    await user.save();
  }

  const token = signToken({ id: user._id, role: user.role });
  return {
    token,
    user: serializeUser(user),
  };
}

export async function loginUser(payload) {
  let user = await User.findOne({ email: payload.email.toLowerCase() }).select("+password");
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const validPassword = await bcrypt.compare(payload.password, user.password);
  if (!validPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  user = await ensureUserWalletIdentity(user);

  const token = signToken({ id: user._id, role: user.role });
  return {
    token,
    user: serializeUser(user),
  };
}

export async function getCurrentUser(user) {
  const normalizedUser = await ensureUserWalletIdentity(user);
  return serializeUser(normalizedUser);
}
