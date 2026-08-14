import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { adminAllowedEmails, adminAuthEnabled, env } from "../config/env";
import { verifyTotp } from "../lib/totp";
import { signAdminToken } from "../lib/admin-jwt";
import type { AdminLoginInput } from "../schemas/admin-auth.schema";

const BCRYPT_ROUNDS = 12;

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  roleName: string;
  roleSlug: string;
  permissions: string[];
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

function toAdminProfile(admin: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  role: { name: string; slug: string; permissions: string[] };
}): AdminProfile {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    avatarUrl: admin.avatarUrl,
    roleName: admin.role.name,
    roleSlug: admin.role.slug,
    permissions: admin.role.permissions,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    lastLoginIp: admin.lastLoginIp,
  };
}

async function audit(adminId: string, action: string, req: { ip?: string; userAgent?: string }, details?: unknown) {
  await prisma.adminAuditLog.create({
    data: { adminId, action, targetType: "admin_session", ipAddress: req.ip, userAgent: req.userAgent, details: details as never },
  });
}

export async function loginAdmin(input: AdminLoginInput, req: { ip?: string; userAgent?: string }) {
  if (!adminAuthEnabled) {
    throw ApiError.internal("Admin console is not configured — ADMIN_ALLOWED_EMAILS/ADMIN_2FA_SECRET/ADMIN_JWT_SECRET must be set");
  }

  const genericError = () => ApiError.unauthorized("Invalid admin credentials or unauthorized account");

  // Allowlist gate runs before anything touches the DB — an email not on the list is rejected
  // even if a matching AdminUser row happens to exist (e.g. a deactivated staff member).
  if (!adminAllowedEmails.has(input.email.toLowerCase())) {
    throw genericError();
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: input.email }, include: { role: true } });
  if (!admin || admin.status !== "ACTIVE") {
    throw genericError();
  }

  const validPassword = await bcrypt.compare(input.password, admin.passwordHash);
  if (!validPassword) {
    throw genericError();
  }

  if (!verifyTotp(env.ADMIN_2FA_SECRET!, input.twoFactorCode)) {
    await audit(admin.id, "login_failed_2fa", req);
    throw ApiError.unauthorized("Invalid or expired 2FA code");
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: { adminId: admin.id, token: sessionToken, ipAddress: req.ip, userAgent: req.userAgent, expiresAt },
  });

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(), lastLoginIp: req.ip },
    include: { role: true },
  });

  await audit(admin.id, "login", req);

  const jwtToken = signAdminToken({
    sub: admin.id,
    sid: sessionToken,
    email: admin.email,
    roleSlug: admin.role.slug,
    permissions: admin.role.permissions,
  });

  return { token: jwtToken, admin: toAdminProfile(updated), expiresAt: expiresAt.toISOString() };
}

export async function logoutAdmin(sessionToken: string, adminId?: string) {
  await prisma.adminSession.deleteMany({ where: { token: sessionToken } });
  if (adminId) await audit(adminId, "logout", {});
}

/** Verifies the session is still valid server-side (not just JWT-signature-valid) — lets a
 * revoked/expired session be rejected immediately instead of waiting out the JWT's own expiry. */
export async function getActiveAdminProfile(adminId: string, sessionToken: string): Promise<AdminProfile | null> {
  const session = await prisma.adminSession.findUnique({ where: { token: sessionToken } });
  if (!session || session.adminId !== adminId || session.expiresAt < new Date()) return null;

  const admin = await prisma.adminUser.findUnique({ where: { id: adminId }, include: { role: true } });
  if (!admin || admin.status !== "ACTIVE") return null;

  return toAdminProfile(admin);
}

export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
