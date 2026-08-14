import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { getGstProvider, getMsmeProvider } from "./verification/verification-provider.factory";
import type { SubmitVerificationInput } from "../schemas/claims.schema";

// STEP 2 (optional): the claimed business's owner submitting GST and/or MSME for the trust
// badge. Mirrors submitClaimDocument's "format-check, then always PENDING" shape — see that
// function's doc comment in claims.service.ts for why the check never auto-approves anything.
export async function submitBusinessVerification(
  businessId: string,
  userId: string,
  input: SubmitVerificationInput
) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    select: { id: true, ownerId: true, isClaimed: true },
  });
  if (!business) throw ApiError.notFound("Business not found");
  if (!business.isClaimed || business.ownerId !== userId) {
    throw ApiError.forbidden("Only the verified owner of a claimed business can request the trust badge");
  }

  const submissions: { method: "gst" | "msme"; number: string }[] = [];
  if (input.gstNumber) submissions.push({ method: "gst", number: input.gstNumber });
  if (input.msmeNumber) submissions.push({ method: "msme", number: input.msmeNumber });

  if (submissions.length === 0) {
    throw ApiError.badRequest("Provide a GST number, an MSME number, or both");
  }

  const created = [];
  for (const submission of submissions) {
    const check =
      submission.method === "gst"
        ? await getGstProvider().verify(submission.number)
        : await getMsmeProvider().verify(submission.number);

    if (!check.formatValid) {
      throw ApiError.badRequest(check.reason ?? `That ${submission.method.toUpperCase()} number doesn't look valid`);
    }

    created.push(
      await prisma.businessVerification.create({
        data: {
          businessId,
          userId,
          method: submission.method,
          registrationNumber: submission.number,
          providerRef: check.providerRef,
          status: "PENDING",
        },
      })
    );
  }

  return created;
}

export interface VerificationStatusView {
  isVerified: boolean;
  records: {
    id: string;
    method: string;
    registrationNumber: string;
    status: string;
    submittedAt: string;
    approvedAt: string | null;
  }[];
}

export async function getVerificationStatus(businessId: string): Promise<VerificationStatusView> {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    select: { isVerified: true },
  });
  if (!business) throw ApiError.notFound("Business not found");

  const records = await prisma.businessVerification.findMany({
    where: { businessId },
    orderBy: { submittedAt: "desc" },
  });

  return {
    isVerified: business.isVerified,
    records: records.map((r) => ({
      id: r.id,
      method: r.method,
      registrationNumber: r.registrationNumber,
      status: r.status,
      submittedAt: r.submittedAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString() ?? null,
    })),
  };
}

// ── Admin review ──────────────────────────────────────────────────────────────────────────

export async function listPendingVerifications() {
  const records = await prisma.businessVerification.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });

  const businesses = await prisma.business.findMany({
    where: { id: { in: records.map((r) => r.businessId) } },
    select: { id: true, name: true, slug: true, city: { select: { name: true } } },
  });
  const businessById = new Map(businesses.map((b) => [b.id, b]));

  return records.map((r) => ({ ...r, business: businessById.get(r.businessId) ?? null }));
}

export async function approveVerification(verificationId: string, adminUserId: string) {
  const record = await prisma.businessVerification.findUnique({ where: { id: verificationId } });
  if (!record) throw ApiError.notFound("Verification request not found");
  if (record.status !== "PENDING") throw ApiError.conflict("This request has already been reviewed");

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.businessVerification.update({
      where: { id: verificationId },
      data: { status: "APPROVED", approvedAt: now, approvedBy: adminUserId },
    });

    // The Verified badge only ever flips on here — never at submission time.
    await tx.business.update({
      where: { id: record.businessId },
      data: { isVerified: true },
    });

    return updated;
  });
}

export async function rejectVerification(verificationId: string, adminUserId: string, adminNotes?: string) {
  const record = await prisma.businessVerification.findUnique({ where: { id: verificationId } });
  if (!record) throw ApiError.notFound("Verification request not found");
  if (record.status !== "PENDING") throw ApiError.conflict("This request has already been reviewed");

  return prisma.businessVerification.update({
    where: { id: verificationId },
    data: { status: "REJECTED", approvedBy: adminUserId, adminNotes },
  });
}
