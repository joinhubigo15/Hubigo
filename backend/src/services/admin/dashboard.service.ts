import { prisma } from "../../lib/prisma";

export async function getDashboardMetrics() {
  const [
    totalBusinesses,
    verifiedBusinesses,
    pendingClaims,
    pendingReviews,
    registeredUsers,
    activeBusinessOwners,
  ] = await Promise.all([
    prisma.business.count({ where: { deletedAt: null } }),
    prisma.business.count({ where: { deletedAt: null, isVerified: true } }),
    prisma.businessClaim.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: { in: ["PENDING", "FLAGGED"] } } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, role: "business_owner" } }),
  ]);

  return {
    totalBusinesses,
    verifiedBusinesses,
    pendingClaims,
    pendingReviews,
    registeredUsers,
    activeBusinessOwners,
    // Billing is dropped for v1 — no subscriptions to compute revenue from.
    monthlyRevenueInr: 0,
  };
}
