import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { prisma } from "../lib/prisma";
import { toPublicUser } from "../services/auth.service";
import {
  updateProfile,
  setAvatar,
  removeAvatar,
  updateNotificationPreferences,
  completeOnboarding,
  listSavedBusinesses,
  saveBusiness,
  removeSavedBusiness,
  listSavedSearches,
  saveSearch,
  removeSavedSearch,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  upsertPushSubscription,
  removePushSubscription,
} from "../services/users.service";
import { listClaimsByUser } from "../services/claims.service";
import {
  updateProfileSchema,
  notificationPreferencesSchema,
  completeOnboardingSchema,
  saveBusinessSchema,
  saveSearchSchema,
  pushSubscriptionSchema,
  removePushSubscriptionSchema,
} from "../schemas/users.schema";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.id } });
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, 200, "Current user", toPublicUser(user));
});

export const patchProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = updateProfileSchema.parse(req.body);
  const user = await updateProfile(req.auth!.id, input);
  return sendSuccess(res, 200, "Profile updated", user);
});

export const putAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No image file was uploaded");
  const user = await setAvatar(req.auth!.id, req.file);
  return sendSuccess(res, 200, "Profile picture updated", user);
});

export const postOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const input = completeOnboardingSchema.parse(req.body);
  const user = await completeOnboarding(req.auth!.id, input);
  return sendSuccess(res, 200, "Onboarding complete", user);
});

export const deleteAvatarHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await removeAvatar(req.auth!.id);
  return sendSuccess(res, 200, "Profile picture removed", user);
});

export const patchNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  const input = notificationPreferencesSchema.parse(req.body);
  const user = await updateNotificationPreferences(req.auth!.id, input);
  return sendSuccess(res, 200, "Notification preferences updated", user);
});

export const getSavedBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const businesses = await listSavedBusinesses(req.auth!.id);
  return sendSuccess(res, 200, "Saved businesses", businesses);
});

export const postSavedBusiness = asyncHandler(async (req: Request, res: Response) => {
  const input = saveBusinessSchema.parse(req.body);
  const saved = await saveBusiness(req.auth!.id, input);
  return sendSuccess(res, 201, "Business saved", saved);
});

export const deleteSavedBusiness = asyncHandler(async (req: Request, res: Response) => {
  await removeSavedBusiness(req.auth!.id, req.params.id);
  return sendSuccess(res, 200, "Business removed from saved list", null);
});

export const getSavedSearches = asyncHandler(async (req: Request, res: Response) => {
  const searches = await listSavedSearches(req.auth!.id);
  return sendSuccess(res, 200, "Saved searches", searches);
});

export const postSavedSearch = asyncHandler(async (req: Request, res: Response) => {
  const input = saveSearchSchema.parse(req.body);
  const saved = await saveSearch(req.auth!.id, input);
  return sendSuccess(res, 201, "Search saved", saved);
});

export const deleteSavedSearch = asyncHandler(async (req: Request, res: Response) => {
  await removeSavedSearch(req.auth!.id, req.params.id);
  return sendSuccess(res, 200, "Saved search removed", null);
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await listNotifications(req.auth!.id);
  return sendSuccess(res, 200, "Notifications", notifications);
});

export const patchNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  await markNotificationRead(req.auth!.id, req.params.id);
  return sendSuccess(res, 200, "Notification marked as read", null);
});

export const patchAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await markAllNotificationsRead(req.auth!.id);
  return sendSuccess(res, 200, "All notifications marked as read", null);
});

export const deleteAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  await clearAllNotifications(req.auth!.id);
  return sendSuccess(res, 200, "Notifications cleared", null);
});

export const postPushSubscription = asyncHandler(async (req: Request, res: Response) => {
  const input = pushSubscriptionSchema.parse(req.body);
  await upsertPushSubscription(req.auth!.id, input);
  return sendSuccess(res, 201, "Push subscription saved", null);
});

export const deletePushSubscription = asyncHandler(async (req: Request, res: Response) => {
  const input = removePushSubscriptionSchema.parse(req.body);
  await removePushSubscription(req.auth!.id, input.endpoint);
  return sendSuccess(res, 200, "Push subscription removed", null);
});

export const getMyClaims = asyncHandler(async (req: Request, res: Response) => {
  const claims = await listClaimsByUser(req.auth!.id);
  return sendSuccess(res, 200, "My claim attempts", claims);
});
