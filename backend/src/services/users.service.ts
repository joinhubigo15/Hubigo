import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { uploadAvatar, deleteAvatar } from "../lib/storage";
import { sendVerificationEmail } from "../lib/email";
import { issueVerificationToken } from "./token.service";
import { toPublicUser } from "./auth.service";
import { env } from "../config/env";
import type {
  UpdateProfileInput,
  NotificationPreferencesInput,
  SaveBusinessInput,
  SaveSearchInput,
  CompleteOnboardingInput,
} from "../schemas/users.schema";

const EMAIL_VERIFICATION_TTL_MIN = 24 * 60;

async function getUserOrThrow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await getUserOrThrow(userId);

  if (input.email && input.email !== user.email) {
    const emailTaken = await prisma.user.findFirst({
      where: { email: input.email, id: { not: userId } },
    });
    if (emailTaken) throw ApiError.conflict("That email is already in use");
  }

  if (input.phone && input.phone !== user.phone) {
    const phoneTaken = await prisma.user.findFirst({
      where: { phone: input.phone, id: { not: userId } },
    });
    if (phoneTaken) throw ApiError.conflict("That mobile number is already in use");
  }

  const emailChanged = Boolean(input.email && input.email !== user.email);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      ...(emailChanged ? { emailVerified: false } : {}),
    },
  });

  if (emailChanged) {
    const rawToken = await issueVerificationToken(
      updated.id,
      "email_verification",
      EMAIL_VERIFICATION_TTL_MIN
    );
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`;
    await sendVerificationEmail(updated.email!, updated.name, verifyUrl);
  }

  return toPublicUser(updated);
}

// First-time-signup wizard completion (Google OAuth path only). Distinct from updateProfile:
// this one always flips onboardingCompleted, and never touches email (it's already real from
// the Google profile, not something the wizard collects).
export async function completeOnboarding(userId: string, input: CompleteOnboardingInput) {
  const user = await getUserOrThrow(userId);

  if (input.phone && input.phone !== user.phone) {
    const phoneTaken = await prisma.user.findFirst({ where: { phone: input.phone, id: { not: userId } } });
    if (phoneTaken) throw ApiError.conflict("That mobile number is already in use");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone,
      onboardingCompleted: true,
      preferredCity: input.preferredCity,
      preferredCategories: input.preferredCategories,
      pincode: input.pincode || undefined,
      referralSource: input.referralSource,
      ...(input.notificationPreferences ?? {}),
    },
  });

  return toPublicUser(updated);
}

export async function setAvatar(userId: string, file: Express.Multer.File) {
  const user = await getUserOrThrow(userId);

  const previousUrl = user.avatarUrl;
  const previousPublicId = user.avatarPublicId;

  const { url, publicId } = await uploadAvatar(file.buffer, file.mimetype, userId);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: url, avatarPublicId: publicId ?? null },
  });

  if (previousUrl) {
    await deleteAvatar(previousUrl, previousPublicId).catch(() => {});
  }

  return toPublicUser(updated);
}

export async function removeAvatar(userId: string) {
  const user = await getUserOrThrow(userId);

  if (user.avatarUrl) {
    await deleteAvatar(user.avatarUrl, user.avatarPublicId).catch(() => {});
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null, avatarPublicId: null },
  });

  return toPublicUser(updated);
}

export async function updateNotificationPreferences(
  userId: string,
  input: NotificationPreferencesInput
) {
  const updated = await prisma.user.update({ where: { id: userId }, data: input });
  return toPublicUser(updated);
}

export function listSavedBusinesses(userId: string) {
  return prisma.savedBusiness.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveBusiness(userId: string, input: SaveBusinessInput) {
  const existing = await prisma.savedBusiness.findUnique({
    where: { userId_listingId: { userId, listingId: input.listingId } },
  });
  if (existing) return existing;

  return prisma.savedBusiness.create({ data: { userId, ...input } });
}

export async function removeSavedBusiness(userId: string, savedBusinessId: string) {
  const result = await prisma.savedBusiness.deleteMany({
    where: { id: savedBusinessId, userId },
  });
  if (result.count === 0) throw ApiError.notFound("Saved business not found");
}

export function listSavedSearches(userId: string) {
  return prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function saveSearch(userId: string, input: SaveSearchInput) {
  return prisma.savedSearch.create({ data: { userId, ...input } });
}

export async function removeSavedSearch(userId: string, savedSearchId: string) {
  const result = await prisma.savedSearch.deleteMany({
    where: { id: savedSearchId, userId },
  });
  if (result.count === 0) throw ApiError.notFound("Saved search not found");
}

export function listNotifications(userId: string) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
  if (result.count === 0) throw ApiError.notFound("Notification not found");
}

export function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}

export function clearAllNotifications(userId: string) {
  return prisma.notification.deleteMany({ where: { userId } });
}

export function upsertPushSubscription(
  userId: string,
  input: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    update: { userId, p256dh: input.keys.p256dh, auth: input.keys.auth },
    create: { userId, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth },
  });
}

export function removePushSubscription(userId: string, endpoint: string) {
  return prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
}
