import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

export function listReviews(businessId: string) {
  return prisma.review.findMany({
    where: { businessId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function replyToReview(businessId: string, reviewId: string, reply: string) {
  const existing = await prisma.review.findFirst({ where: { id: reviewId, businessId } });
  if (!existing) throw ApiError.notFound("Review not found");
  return prisma.review.update({ where: { id: reviewId }, data: { ownerReply: reply, ownerRepliedAt: new Date() } });
}
