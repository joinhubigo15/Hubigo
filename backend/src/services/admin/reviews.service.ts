import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { ListReviewsQuery } from "../../schemas/admin.schema";

export async function listReviews(query: ListReviewsQuery) {
  const where: Prisma.ReviewWhereInput = {};
  if (query.status) where.status = query.status;

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const businesses = await prisma.business.findMany({
    where: { id: { in: reviews.map((r) => r.businessId) } },
    select: { id: true, name: true, slug: true },
  });
  const businessById = new Map(businesses.map((b) => [b.id, b]));

  const items = reviews.map((r) => {
    const business = businessById.get(r.businessId);
    return {
      id: r.id,
      businessName: business?.name ?? "Unknown business",
      businessSlug: business?.slug ?? "",
      userName: r.user?.name ?? r.authorName ?? "Anonymous",
      userEmail: r.user?.email ?? null,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      flaggedReason: r.flaggedReason,
      createdAt: r.createdAt.toISOString(),
    };
  });

  return { items, total, page: query.page, pageSize: query.pageSize };
}

async function findReview(id: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw ApiError.notFound("Review not found");
  return review;
}

export async function approveReview(id: string) {
  await findReview(id);
  return prisma.review.update({ where: { id }, data: { status: "APPROVED" } });
}

export async function flagReview(id: string, reason: string) {
  await findReview(id);
  return prisma.review.update({ where: { id }, data: { status: "FLAGGED", flaggedReason: reason } });
}

export async function markReviewSpam(id: string) {
  await findReview(id);
  return prisma.review.update({ where: { id }, data: { status: "SPAM" } });
}

// A hard delete, not a status change — for spam/abusive content an admin wants gone from the
// platform entirely, not just hidden behind a SPAM/FLAGGED status (which still exists in the DB
// and could theoretically resurface).
export async function deleteReview(id: string) {
  await findReview(id);
  await prisma.review.delete({ where: { id } });
}
