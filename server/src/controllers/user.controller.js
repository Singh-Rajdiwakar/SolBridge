import { sendSuccess } from "../utils/response.js";
import {
  addUserWatchlistItem,
  getUserPreferences,
  getUserProfile,
  linkUserWallet,
  listUserWatchlist,
  removeUserWatchlistItem,
  updateUserProfile,
  updateUserPreferences,
} from "../services/user.service.js";
import {
  linkedWalletSchema,
  userProfileUpdateSchema,
  userPreferencesSchema,
  userWatchlistCreateSchema,
  watchlistSymbolParamsSchema,
} from "../validators/user.validators.js";

export async function profile(req, res) {
  return sendSuccess(res, await getUserProfile(req.user._id));
}

export async function putProfile(req, res) {
  const payload = userProfileUpdateSchema.parse(req.body);
  return sendSuccess(res, await updateUserProfile(req.user._id, payload));
}

export async function getPreferences(req, res) {
  return sendSuccess(res, await getUserPreferences(req.user._id));
}

export async function putPreferences(req, res) {
  const payload = userPreferencesSchema.parse(req.body);
  return sendSuccess(res, await updateUserPreferences(req.user._id, payload));
}

export async function getWatchlist(req, res) {
  return sendSuccess(res, await listUserWatchlist(req.user._id));
}

export async function postWatchlist(req, res) {
  const payload = userWatchlistCreateSchema.parse(req.body);
  return sendSuccess(res, await addUserWatchlistItem(req.user._id, payload), 201);
}

export async function deleteWatchlist(req, res) {
  const params = watchlistSymbolParamsSchema.parse(req.params);
  return sendSuccess(res, await removeUserWatchlistItem(req.user._id, params.symbol));
}

export async function postLinkedWallet(req, res) {
  const payload = linkedWalletSchema.parse(req.body);
  return sendSuccess(res, await linkUserWallet(req.user._id, payload), 201);
}
