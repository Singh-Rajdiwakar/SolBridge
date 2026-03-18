import { sendSuccess } from "../utils/response.js";
import {
  followWallet,
  getFollowingOverview,
  getLeaderboards,
  getPublicProfile,
  getSharedSnapshots,
  getSocialFeed,
  getTrendingWallets,
  getWalletBadges,
  searchPublicWallets,
  sharePortfolioSnapshot,
  unfollowWallet,
  updatePublicProfile,
} from "../services/social.service.js";
import {
  socialFeedQuerySchema,
  socialLeaderboardsQuerySchema,
  socialProfileUpdateSchema,
  socialSearchQuerySchema,
  socialSnapshotCreateSchema,
  socialTrendingQuerySchema,
  socialWalletParamsSchema,
} from "../validators/social.validators.js";

export async function trending(req, res) {
  const query = socialTrendingQuerySchema.parse(req.query);
  return sendSuccess(res, await getTrendingWallets(query.limit));
}

export async function leaderboards(req, res) {
  const query = socialLeaderboardsQuerySchema.parse(req.query);
  return sendSuccess(res, await getLeaderboards(query.period));
}

export async function profile(req, res) {
  const params = socialWalletParamsSchema.parse(req.params);
  return sendSuccess(res, await getPublicProfile(params.walletAddress, req.user?._id || null));
}

export async function putProfile(req, res) {
  const params = socialWalletParamsSchema.parse(req.params);
  const payload = socialProfileUpdateSchema.parse(req.body);
  return sendSuccess(res, await updatePublicProfile(req.user._id, params.walletAddress, payload));
}

export async function postFollow(req, res) {
  const params = socialWalletParamsSchema.parse(req.params);
  return sendSuccess(res, await followWallet(req.user._id, params.walletAddress), 201);
}

export async function deleteFollow(req, res) {
  const params = socialWalletParamsSchema.parse(req.params);
  return sendSuccess(res, await unfollowWallet(req.user._id, params.walletAddress));
}

export async function following(req, res) {
  return sendSuccess(res, await getFollowingOverview(req.user._id));
}

export async function feed(req, res) {
  const query = socialFeedQuerySchema.parse(req.query);
  return sendSuccess(res, await getSocialFeed(query));
}

export async function postShareSnapshot(req, res) {
  const payload = socialSnapshotCreateSchema.parse(req.body);
  return sendSuccess(res, await sharePortfolioSnapshot(req.user._id, payload), 201);
}

export async function snapshots(req, res) {
  const params = socialWalletParamsSchema.parse(req.params);
  return sendSuccess(res, await getSharedSnapshots(params.walletAddress, req.user?._id || null));
}

export async function search(req, res) {
  const query = socialSearchQuerySchema.parse(req.query);
  return sendSuccess(res, await searchPublicWallets(query));
}

export async function badges(req, res) {
  const params = socialWalletParamsSchema.parse(req.params);
  return sendSuccess(res, await getWalletBadges(params.walletAddress, req.user?._id || null));
}
