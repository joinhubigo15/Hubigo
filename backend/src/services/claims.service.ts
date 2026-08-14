import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { uploadClaimDocument } from "../lib/storage";
import { notifyUser } from "./notifications.service";
import type { ClaimDocumentInput } from "../schemas/claims.schema";

export type ClaimMethod = "document";

// Claiming a business is how a plain "user" account becomes a "business_owner" — same
// role-promotion pattern already used by login/register's `requestedRole` (auth.service.ts),
// just triggered by a successful claim instead of an explicit signup choice.
async function promoteToBusinessOwner(tx: Prisma.TransactionClient, userId: string) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user && user.role === "user") {
    await tx.user.update({ where: { id: userId }, data: { role: "business_owner" } });
  }
}

// Writes the PENDING BusinessClaim audit row for admin review. Ownership on the Business row
// itself is only ever assigned once an admin calls approveClaim below — document claims are
// never auto-approved.
async function queueBusinessClaim(
  businessId: string,
  userId: string,
  opts: {
    contactPhone: string;
    contactEmail: string;
    docType: string;
    proofValue?: string;
    proofUrl?: string;
    proofFileName?: string;
  }
) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    select: { id: true, isClaimed: true },
  });
  if (!business) throw ApiError.notFound("Business not found");
  if (business.isClaimed) throw ApiError.conflict("This business has already been claimed");

  return prisma.businessClaim.create({
    data: {
      businessId,
      userId,
      verificationMethod: "document" satisfies ClaimMethod,
      contactPhone: opts.contactPhone,
      contactEmail: opts.contactEmail,
      docType: opts.docType,
      proofValue: opts.proofValue,
      proofUrl: opts.proofUrl,
      proofFileName: opts.proofFileName,
      status: "PENDING",
    },
  });
}

// STEP 1: uploads the proof document to storage and queues a PENDING BusinessClaim for admin
// review. Ownership is only assigned once an admin calls approveClaim.
export async function submitClaimDocument(
  businessId: string,
  userId: string,
  input: ClaimDocumentInput,
  file: { buffer: Buffer; mimetype: string; originalname: string }
) {
  const { url } = await uploadClaimDocument(file.buffer, file.mimetype, businessId);

  const claim = await queueBusinessClaim(businessId, userId, {
    contactPhone: input.contactPhone,
    contactEmail: input.contactEmail,
    docType: input.docType,
    proofValue: input.docNumber,
    proofUrl: url,
    proofFileName: file.originalname,
  });

  await prisma.activityLog.create({
    data: { userId, action: "claim_submitted", entity: "Business", entityId: businessId },
  });

  return claim;
}

export interface ClaimStatusView {
  isClaimed: boolean;
  claimedAt: string | null;
  claimVerificationMethod: string | null;
  latestClaim: {
    id: string;
    status: string;
    verificationMethod: string;
    docType: string;
    proofValue: string | null;
    proofUrl: string | null;
    proofFileName: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
}

export async function getClaimStatus(businessId: string): Promise<ClaimStatusView> {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    select: { isClaimed: true, claimedAt: true, claimVerificationMethod: true },
  });
  if (!business) throw ApiError.notFound("Business not found");

  const latestClaim = await prisma.businessClaim.findFirst({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });

  return {
    isClaimed: business.isClaimed,
    claimedAt: business.claimedAt?.toISOString() ?? null,
    claimVerificationMethod: business.claimVerificationMethod,
    latestClaim: latestClaim
      ? {
          id: latestClaim.id,
          status: latestClaim.status,
          verificationMethod: latestClaim.verificationMethod,
          docType: latestClaim.docType,
          proofValue: latestClaim.proofValue,
          proofUrl: latestClaim.proofUrl,
          proofFileName: latestClaim.proofFileName,
          createdAt: latestClaim.createdAt.toISOString(),
          reviewedAt: latestClaim.reviewedAt?.toISOString() ?? null,
        }
      : null,
  };
}

// ── Admin review (document-upload ownership claims — always start PENDING) ──────────────────

// businessId on BusinessClaim is a plain scalar (see the schema's off-limits-Business-relations
// note), so the business name/city shown in the admin queue is joined manually here rather than
// via a Prisma `include`.
// Returns every claim regardless of status, newest first, so the admin queue keeps a full
// moderation history (approved/rejected claims stay visible with their reviewed-at/adminNotes)
// instead of vanishing the moment they're actioned.
export async function listAllClaims() {
  const claims = await prisma.businessClaim.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });

  const businesses = await prisma.business.findMany({
    where: { id: { in: claims.map((c) => c.businessId) } },
    select: { id: true, name: true, slug: true, city: { select: { name: true } } },
  });
  const businessById = new Map(businesses.map((b) => [b.id, b]));

  return claims.map((c) => ({ ...c, business: businessById.get(c.businessId) ?? null }));
}

// Every claim a given user has ever submitted, across any business — powers the
// business-dashboard "My Claims" view (what did I attempt, and what happened to it).
export async function listClaimsByUser(userId: string) {
  const claims = await prisma.businessClaim.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const businesses = await prisma.business.findMany({
    where: { id: { in: claims.map((c) => c.businessId) } },
    select: { id: true, name: true, slug: true, city: { select: { name: true } } },
  });
  const businessById = new Map(businesses.map((b) => [b.id, b]));

  return claims.map((c) => ({ ...c, business: businessById.get(c.businessId) ?? null }));
}

export async function approveClaim(claimId: string, adminUserId: string) {
  const claim = await prisma.businessClaim.findUnique({ where: { id: claimId } });
  if (!claim) throw ApiError.notFound("Claim not found");
  if (claim.status !== "PENDING") throw ApiError.conflict("This claim has already been reviewed");

  return prisma.$transaction(async (tx) => {
    const business = await tx.business.findFirst({
      where: { id: claim.businessId, deletedAt: null },
      select: { id: true, isClaimed: true },
    });
    if (!business) throw ApiError.notFound("Business not found");
    if (business.isClaimed) throw ApiError.conflict("This business has already been claimed by another request");

    const now = new Date();

    await tx.businessClaim.update({
      where: { id: claimId },
      data: { status: "APPROVED", reviewedAt: now, reviewedBy: adminUserId },
    });

    await promoteToBusinessOwner(tx, claim.userId);

    return tx.business.update({
      where: { id: claim.businessId },
      data: {
        ownerId: claim.userId,
        isClaimed: true,
        claimedAt: now,
        claimVerificationMethod: claim.verificationMethod,
        // An admin approving the ownership claim already means they reviewed a real business
        // document — that's the same bar the separate GST/MSME "Verified" badge flow requires,
        // so the badge activates immediately here too instead of making the new owner submit a
        // second, redundant verification for a document an admin just approved.
        isVerified: true,
      },
    });
  }).then(async (business) => {
    await notifyUser(
      claim.userId,
      "claim_approved",
      "Business claim approved 🎉",
      `Your claim on "${business.name}" was approved — you now have full owner access to manage it.`,
      `/business-dashboard`
    ).catch(() => {});
    return business;
  });
}

export async function rejectClaim(claimId: string, adminUserId: string, adminNotes?: string) {
  const claim = await prisma.businessClaim.findUnique({ where: { id: claimId } });
  if (!claim) throw ApiError.notFound("Claim not found");
  if (claim.status !== "PENDING") throw ApiError.conflict("This claim has already been reviewed");

  const updated = await prisma.businessClaim.update({
    where: { id: claimId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedBy: adminUserId, adminNotes },
  });

  const business = await prisma.business.findUnique({ where: { id: claim.businessId }, select: { name: true } });
  await notifyUser(
    claim.userId,
    "claim_rejected",
    "Business claim rejected",
    adminNotes
      ? `Your claim on "${business?.name ?? "this business"}" was rejected: ${adminNotes}`
      : `Your claim on "${business?.name ?? "this business"}" was rejected. Contact support for details.`
  ).catch(() => {});

  return updated;
}

// ── "My business" lookup (dashboard needs to know which business it's showing) ──────────────

/**
 * Resolves "the" business a dashboard request is scoped to. When `businessId` is given (an owner
 * with multiple businesses picked one via the dashboard switcher) it's looked up and ownership-
 * checked; otherwise falls back to the most recently claimed/created business, same as before the
 * switcher existed — so single-business owners and old clients that don't send an id keep working.
 */
export function getOwnedBusiness(userId: string, businessId?: string) {
  if (businessId) {
    return prisma.business.findFirst({ where: { id: businessId, ownerId: userId, deletedAt: null } });
  }
  return prisma.business.findFirst({
    where: { ownerId: userId, deletedAt: null },
    orderBy: { claimedAt: "desc" },
  });
}

/** All businesses a user owns (claimed or self-listed) — powers the dashboard's business switcher. */
export function listOwnedBusinesses(userId: string) {
  return prisma.business.findMany({
    where: { ownerId: userId, deletedAt: null },
    orderBy: { claimedAt: "desc" },
    select: { id: true, name: true, slug: true, logoUrl: true, isVerified: true, status: true, planTier: true },
  });
}
