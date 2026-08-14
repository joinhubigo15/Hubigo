import { prisma } from "../../lib/prisma";

interface NamedCount {
  name: string;
  count: number;
}

async function topSubcategories(): Promise<{ items: NamedCount[]; source: "search_logs" | "listing_counts" }> {
  const fromSearchLogs = await prisma.searchLog.groupBy({
    by: ["categorySlug"],
    where: { categorySlug: { not: null } },
    _count: true,
    orderBy: { _count: { categorySlug: "desc" } },
    take: 5,
  });

  if (fromSearchLogs.length > 0) {
    const slugs = fromSearchLogs.map((r) => r.categorySlug as string);
    const categories = await prisma.category.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } });
    const nameBySlug = new Map(categories.map((c) => [c.slug, c.name]));
    return {
      items: fromSearchLogs.map((r) => ({ name: nameBySlug.get(r.categorySlug as string) ?? (r.categorySlug as string), count: r._count })),
      source: "search_logs",
    };
  }

  const fromListings = await prisma.businessCategory.groupBy({
    by: ["categoryId"],
    _count: true,
    orderBy: { _count: { categoryId: "desc" } },
    take: 5,
  });
  const categories = await prisma.category.findMany({
    where: { id: { in: fromListings.map((r) => r.categoryId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  return {
    items: fromListings.map((r) => ({ name: nameById.get(r.categoryId) ?? r.categoryId, count: r._count })),
    source: "listing_counts",
  };
}

async function topCities(): Promise<{ items: NamedCount[]; source: "search_logs" | "listing_counts" }> {
  const fromSearchLogs = await prisma.searchLog.groupBy({
    by: ["citySlug"],
    where: { citySlug: { not: null } },
    _count: true,
    orderBy: { _count: { citySlug: "desc" } },
    take: 5,
  });

  if (fromSearchLogs.length > 0) {
    const slugs = fromSearchLogs.map((r) => r.citySlug as string);
    const cities = await prisma.city.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } });
    const nameBySlug = new Map(cities.map((c) => [c.slug, c.name]));
    return {
      items: fromSearchLogs.map((r) => ({ name: nameBySlug.get(r.citySlug as string) ?? (r.citySlug as string), count: r._count })),
      source: "search_logs",
    };
  }

  const fromListings = await prisma.business.groupBy({
    by: ["cityId"],
    where: { deletedAt: null },
    _count: true,
    orderBy: { _count: { cityId: "desc" } },
    take: 5,
  });
  const cities = await prisma.city.findMany({
    where: { id: { in: fromListings.map((r) => r.cityId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(cities.map((c) => [c.id, c.name]));
  return {
    items: fromListings.map((r) => ({ name: nameById.get(r.cityId) ?? r.cityId, count: r._count })),
    source: "listing_counts",
  };
}

export async function getAnalytics() {
  const [totalSearches, profileViews, totalLeads, totalClaims, approvedClaims, subcategories, cities] = await Promise.all([
    prisma.searchLog.count(),
    prisma.business.aggregate({ _sum: { viewCount: true } }),
    prisma.lead.count(),
    prisma.businessClaim.count(),
    prisma.businessClaim.count({ where: { status: "APPROVED" } }),
    topSubcategories(),
    topCities(),
  ]);

  const claimConversionRate = totalClaims === 0 ? 0 : Math.round((approvedClaims / totalClaims) * 1000) / 10;

  return {
    totalSearches,
    totalProfileViews: profileViews._sum.viewCount ?? 0,
    totalLeads,
    claimConversionRate,
    topSubcategories: subcategories.items,
    topSubcategoriesSource: subcategories.source,
    topCities: cities.items,
    topCitiesSource: cities.source,
  };
}
