import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { signAccessToken } from "../lib/jwt";
import {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  issueVerificationToken,
  consumeVerificationToken,
} from "./token.service";
import { sendVerificationEmail } from "../lib/email";
import { env } from "../config/env";

const EMAIL_VERIFICATION_TTL_MIN = 24 * 60;

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    onboardingCompleted: user.onboardingCompleted,
    preferredCity: user.preferredCity,
    preferredCategories: user.preferredCategories,
    pincode: user.pincode,
    notificationPreferences: {
      emailLeadAlerts: user.emailLeadAlerts,
      emailMarketing: user.emailMarketing,
      whatsappUpdates: user.whatsappUpdates,
      smsAlerts: user.smsAlerts,
    },
    createdAt: user.createdAt,
  };
}

async function issueSession(user: User) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);
  return { accessToken, refreshToken };
}

export async function refreshSession(rawRefreshToken: string) {
  const rotation = await rotateRefreshToken(rawRefreshToken);

  if (!rotation) {
    throw ApiError.unauthorized("Session expired or invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: rotation.userId } });

  if (!user || user.deletedAt) {
    throw ApiError.unauthorized("User account no longer exists");
  }

  // A suspension applied mid-session must take effect at the next refresh, not wait out the
  // (short-lived) access token's own expiry — otherwise "suspend this user" silently does
  // nothing until they happen to log out.
  if (user.isSuspended) {
    await revokeRefreshToken(rotation.rawToken);
    throw ApiError.forbidden("This account has been suspended. Contact support for help.");
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });

  return {
    accessToken,
    refreshToken: rotation.rawToken,
    user: toPublicUser(user),
  };
}

export async function logoutUser(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) return;
  await revokeRefreshToken(rawRefreshToken);
}

export async function verifyEmail(rawToken: string) {
  const record = await consumeVerificationToken(rawToken, "email_verification");

  if (!record) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  });
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified || !user.email) return;

  // The outbound send is deliberately NOT awaited: this function's caller responds to the
  // client with the same generic message regardless of whether an account exists, and awaiting
  // a network call to the email provider only for the "account exists" branch would reopen a
  // timing side-channel for enumerating registered emails (same class of bug as the login
  // timing fix above) — the response now returns in DB-query time either way.
  const rawToken = await issueVerificationToken(user.id, "email_verification", EMAIL_VERIFICATION_TTL_MIN);
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`;
  sendVerificationEmail(user.email, user.name, verifyUrl).catch((err) => {
    console.error("Failed to resend verification email:", err);
  });
}

export async function findOrCreateGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
  role?: "user" | "business_owner";
}) {
  const requestedRole = profile.role === "business_owner" ? "business_owner" : "user";

  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerUserId: { provider: "google", providerUserId: profile.googleId } },
    include: { user: true },
  });

  if (existingAccount) {
    let user = existingAccount.user;
    // The Google callback route calls issueSession() directly on this return value, so
    // suspension/soft-delete has to be checked here too, or Google sign-in becomes a bypass
    // for a locked-out account.
    if (user.deletedAt || user.isSuspended) {
      throw new Error("This account has been suspended. Contact support for help.");
    }
    if (requestedRole === "business_owner" && user.role !== "business_owner" && user.role !== "admin" && user.role !== "super_admin") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "business_owner" },
      });
    }
    return user;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: profile.email } });

  if (existingUser) {
    if (existingUser.deletedAt || existingUser.isSuspended) {
      throw new Error("This account has been suspended. Contact support for help.");
    }
    await prisma.oAuthAccount.create({
      data: { userId: existingUser.id, provider: "google", providerUserId: profile.googleId },
    });
    let user = existingUser;
    if (requestedRole === "business_owner" && user.role !== "business_owner" && user.role !== "admin" && user.role !== "super_admin") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "business_owner" },
      });
    }
    return user;
  }

  const newUser = await prisma.user.create({
    data: {
      name: profile.name,
      email: profile.email,
      role: requestedRole,
      emailVerified: true,
      oauthAccounts: {
        create: { provider: "google", providerUserId: profile.googleId },
      },
    },
  });

  return newUser;
}

export { issueSession };
