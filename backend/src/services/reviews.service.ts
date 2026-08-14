import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

/**
 * Customer-submitted reviews publish immediately (status: APPROVED) — there is no admin
 * moderation queue for this path, by explicit product decision. Admin moderation
 * (admin/reviews.controller.ts flag/spam) still applies after the fact to published reviews.
 */
export async function createReview(businessId: string, userId: string, rating: number, comment: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null, status: "approved" },
    select: { id: true },
  });
  if (!business) throw ApiError.notFound("Business not found");

  const existing = await prisma.review.findFirst({ where: { businessId, userId } });
  if (existing) throw ApiError.conflict("You have already reviewed this business");

  return prisma.review.create({
    data: { businessId, userId, rating, comment, status: "APPROVED" },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
}
