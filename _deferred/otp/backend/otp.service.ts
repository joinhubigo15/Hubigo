import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { getOtpProvider } from "./otp-provider.factory";

function generateCode(): string {
  // 6-digit numeric code, matching the UI's 6-box OTP input.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// ── Business-listing phone number verification (dashboard "Profile" page) ─────────────────
// An already-claimed business's owner updating its public contact number — no isClaimed check
// needed (they already own it), success updates Business.phone directly. Ownership claims
// themselves use a document-upload flow instead — see claims.service.ts.

export async function sendBusinessPhoneUpdateOtp(businessId: string, userId: string, phone: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MIN * 60 * 1000);

  await prisma.otp.create({ data: { businessId, userId, phone, codeHash: hashCode(code), expiresAt } });

  const provider = getOtpProvider();
  await provider.sendOtp(phone, code);

  return { expiresInSeconds: env.OTP_TTL_MIN * 60 };
}

export async function verifyBusinessPhoneUpdateOtp(businessId: string, userId: string, phone: string, code: string) {
  const otp = await prisma.otp.findFirst({
    where: { businessId, userId, phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) throw ApiError.badRequest("No pending OTP for this number — request a new one");
  if (otp.expiresAt < new Date()) throw ApiError.badRequest("This OTP has expired — request a new one");
  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) throw ApiError.tooManyRequests("Too many incorrect attempts — request a new OTP");

  if (otp.codeHash !== hashCode(code)) {
    await prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw ApiError.badRequest("Incorrect OTP — please try again");
  }

  await prisma.otp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  return prisma.business.update({ where: { id: businessId }, data: { phone } });
}
