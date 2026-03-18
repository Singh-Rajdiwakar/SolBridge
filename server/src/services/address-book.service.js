import { AddressBook } from "../models/AddressBook.js";
import { AppError } from "../utils/app-error.js";

export async function listAddressBookEntries(userId) {
  return AddressBook.find({ userId }).sort({ lastUsedAt: -1, createdAt: -1 });
}

export async function createAddressBookEntry(userId, payload) {
  try {
    return await AddressBook.create({
      userId,
      ...payload,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("This wallet address is already saved in your address book", 409);
    }
    throw error;
  }
}

export async function updateAddressBookEntry(userId, id, payload) {
  let entry;
  try {
    entry = await AddressBook.findOneAndUpdate(
      { _id: id, userId },
      payload,
      { new: true, runValidators: true },
    );
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("This wallet address is already saved in your address book", 409);
    }
    throw error;
  }

  if (!entry) {
    throw new AppError("Address book contact not found", 404);
  }

  return entry;
}

export async function deleteAddressBookEntry(userId, id) {
  const entry = await AddressBook.findOneAndDelete({ _id: id, userId });
  if (!entry) {
    throw new AppError("Address book contact not found", 404);
  }

  return entry;
}

export async function markAddressBookEntryUsed(userId, walletAddress) {
  const entry = await AddressBook.findOneAndUpdate(
    { userId, walletAddress },
    { lastUsedAt: new Date() },
    { new: true },
  );

  return entry;
}
