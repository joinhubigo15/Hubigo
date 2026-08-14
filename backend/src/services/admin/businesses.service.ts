import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { notifyUser } from "../notifications.service";
import type { ListBusinessesQuery } from "../../schemas/admin.schema";

export interface AdminBusinessRow {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  subcategory: string | null;
  city: string;
  area: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  isVerified: boolean;
  isClaimed: boolean;
  planTier: string;
  rating: number;
  reviewsCount: number;
  status: string;
  createdAt: string;
}

async function toAdminBusinessRow(business: {
  id: string;
  name: string;
  slug: string;
  isVerified: boolean;
  isClaimed: boolean;
  planTier: string;
  avgRating: number;
  reviewCount: number;
  status: string;
  createdAt: Date;
  city: { name: string };
  locality: { name: string } | null;
  owner: { name: string; email: string | null } | null;
}): Promise<AdminBusinessRow> {
  const primaryLink = await prisma.businessCategory.findFirst({
    where: { businessId: business.id },
    orderBy: [{ isPrimary: "desc" }],
    include: { category: { include: { parent: true } } },
  });

  let category: string | null = null;
  let subcategory: string | null = null;
  if (primaryLink) {
    if (primaryLink.category.parentId && primaryLink.category.parent) {
      category = primaryLink.category.parent.name;
      subcategory = primaryLink.category.name;
    } else {
      category = primaryLink.category.name;
      subcategory = null;
    }
  }

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    category,
    subcategory,
    city: business.city.name,
    area: business.locality?.name ?? null,
    ownerName: business.owner?.name ?? null,
    ownerEmail: business.owner?.email ?? null,
    isVerified: business.isVerified,
    isClaimed: business.isClaimed,
    planTier: business.planTier,
    rating: business.avgRating,
    reviewsCount: business.reviewCount,
    status: business.status,
    createdAt: business.createdAt.toISOString(),
  };
}

export async function listBusinesses(query: ListBusinessesQuery) {
  const where: Prisma.BusinessWhereInput = { deletedAt: null };
  if (query.search) where.name = { contains: query.search, mode: "insensitive" };
  if (query.city) where.city = { slug: query.city };
  if (query.status) where.status = query.status;
  if (query.verified !== undefined) where.isVerified = query.verified;
  if (query.claimed !== undefined) where.isClaimed = query.claimed;

  const [total, businesses] = await Promise.all([
    prisma.business.count({ where }),
    prisma.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        city: { select: { name: true } },
        locality: { select: { name: true } },
        owner: { select: { name: true, email: true } },
      },
    }),
  ]);

  const items = await Promise.all(businesses.map(toAdminBusinessRow));

  return { items, total, page: query.page, pageSize: query.pageSize };
}

async function findActiveBusiness(id: string) {
  const business = await prisma.business.findFirst({ where: { id, deletedAt: null } });
  if (!business) throw ApiError.notFound("Business not found");
  return business;
}

export async function verifyBusiness(id: string) {
  await findActiveBusiness(id);
  return prisma.business.update({ where: { id }, data: { isVerified: true } });
}

export async function unverifyBusiness(id: string) {
  await findActiveBusiness(id);
  return prisma.business.update({ where: { id }, data: { isVerified: false } });
}

export async function updateBusinessStatus(id: string, status: "pending" | "approved" | "rejected") {
  await findActiveBusiness(id);
  return prisma.business.update({ where: { id }, data: { status } });
}

export async function deleteBusiness(id: string) {
  const business = await findActiveBusiness(id);
  const updated = await prisma.business.update({ where: { id }, data: { deletedAt: new Date() } });
  if (business.ownerId) {
    notifyUser(
      business.ownerId,
      "business_deleted",
      `Your listing "${business.name}" was removed`,
      "This business was removed from Hubigo by our team. Contact support if you have questions.",
      "/contact"
    ).catch(() => {});
  }
  return updated;
}
