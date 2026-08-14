import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import type { VerificationTokenType } from "@prisma/client";

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ── Refresh tokens (opaque, rotated on every use) ──────────────────────────

export async function issueRefreshToken(userId: string): Promise<string> {
  const rawToken = generateRawToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(rawToken), expiresAt },
  });

  return rawToken;
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const newRawToken = await issueRefreshToken(existing.userId);
  return { userId: existing.userId, rawToken: newRawToken };
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ── Verification tokens (email verification / password reset) ─────────────

export async function issueVerificationToken(
  userId: string,
  type: VerificationTokenType,
  ttlMinutes: number
): Promise<string> {
  const rawToken = generateRawToken();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.verificationToken.create({
    data: { userId, type, tokenHash: hashToken(rawToken), expiresAt },
  });

  return rawToken;
}

export async function consumeVerificationToken(rawToken: string, type: VerificationTokenType) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record;
}
