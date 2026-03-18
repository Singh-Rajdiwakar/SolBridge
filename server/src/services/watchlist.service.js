import { Watchlist } from "../models/Watchlist.js";
import { AppError } from "../utils/app-error.js";

export async function getWatchlistByUserId(userId) {
  return (
    (await Watchlist.findOne({ userId })) || {
      userId,
      items: [],
    }
  );
}

export async function addWatchlistItem(userId, payload) {
  const watchlist = await Watchlist.findOne({ userId });
  if (!watchlist) {
    return Watchlist.create({
      userId,
      items: [payload],
    });
  }

  if (watchlist.items.some((item) => item.symbol === payload.symbol)) {
    throw new AppError("Coin already exists in watchlist", 409);
  }

  watchlist.items.push(payload);
  await watchlist.save();
  return watchlist;
}

export async function removeWatchlistItem(userId, symbol) {
  const watchlist = await Watchlist.findOne({ userId });
  if (!watchlist) {
    return {
      userId,
      items: [],
    };
  }

  watchlist.items = watchlist.items.filter((item) => item.symbol !== symbol);
  await watchlist.save();
  return watchlist;
}
