import { prisma } from "@/app/lib/db";
import { resolveImageUrl } from "@/app/lib/utils";
import type { BusinessDetail, CategoryOption, BusinessSummary, PaginatedResult, SearchFilters } from "@/app/lib/search-api";

export async function getBusinessBySlugDirect(slug: string): Promise<BusinessDetail | null> {
  try {
    const business: any = await prisma.business.findFirst({
      where: { slug, deletedAt: null, status: "approved" },
      include: {
        city: true,
        locality: true,
        categories: { include: { category: { include: { parent: true } } } },
        amenities: { include: { amenity: true } },
        services: true,
        hours: true,
        media: { orderBy: { sortOrder: "asc" } },
        reviews: { orderBy: { createdAt: "desc" }, take: 10, include: { user: true } },
      },
    });

    if (!business) return null;

    const primaryBc = business.categories.find((c: any) => c.isPrimary) ?? business.categories[0];
    const category = primaryBc?.category;
    const parentCategory = category?.parent ?? null;
    const subcategory = parentCategory ? category : null;
    const mainCategory = parentCategory ?? category ?? null;

    return {
      id: business.id,
      slug: business.slug,
      name: business.name,
      description: business.description,
      planTier: business.planTier,
      isVerified: business.isVerified,
      isTrusted: business.isTrusted,
      avgRating: Number(business.avgRating),
      reviewCount: business.reviewCount,
      priceRange: business.priceRange,
      phone: business.phone,
      whatsappPhone: business.whatsapp,
      website: business.websiteUrl,
      isClaimed: Boolean(business.ownerId),
      openHoursRaw: null,
      isOpenNow: true,
      closesAt: null,
      hoursInferredFromSingleDay: false,
      viewCount: business.viewCount || 0,
      areaName: business.locality?.name || null,
      address: business.address,
      pincode: business.pincode,
      city: business.city ? { id: business.city.id, name: business.city.name, slug: business.city.slug } : { id: "", name: "Bangalore", slug: "bangalore" },
      locality: business.locality ? { id: business.locality.id, name: business.locality.name, slug: business.locality.slug } : null,
      lat: business.lat != null ? Number(business.lat) : null,
      lng: business.lng != null ? Number(business.lng) : null,
      coverImageUrl: resolveImageUrl(business.coverImageUrl),
      logoUrl: resolveImageUrl(business.logoUrl),
      categories: business.categories.map((bc: any) => ({
        isPrimary: bc.isPrimary,
        category: { id: bc.category.id, name: bc.category.name, slug: bc.category.slug },
      })),
      amenities: business.amenities.map((a: any) => ({ id: a.amenity.id, name: a.amenity.name, slug: a.amenity.slug, icon: a.amenity.icon })),
      services: business.services.map((s: any) => ({ id: s.id, name: s.name, description: s.description, price: s.price ? Number(s.price) : null })),
      hours: business.hours.map((h: any) => ({ dayOfWeek: h.dayOfWeek, openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed })),
      media: business.media.map((m: any) => ({ id: m.id, type: m.type, url: resolveImageUrl(m.url)!, caption: m.caption })),
      offers: [],
      products: [],
      reviews: (business.reviews || []).map((r: any) => ({
        id: r.id,
        rating: Number(r.rating),
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        userName: r.user?.name || "Anonymous Patient",
        userAvatarUrl: resolveImageUrl(r.user?.avatarUrl),
      })),
    };
  } catch (err) {
    console.error("Error in getBusinessBySlugDirect:", err);
    return null;
  }
}

export async function getCategoriesDirect(): Promise<CategoryOption[]> {
  try {
    const categories: any[] = await prisma.category.findMany({
      include: {
        children: true,
      },
      orderBy: { name: "asc" },
    });

    const parents = categories.filter((c: any) => !c.parentId);
    return parents.map((p: any) => {
      const children = categories.filter((c: any) => c.parentId === p.id);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        icon: p.icon,
        businessCount: (p._count?.businesses || 0) + children.reduce((acc: number, c: any) => acc + (c._count?.businesses || 0), 0),
        subcategories: children.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          businessCount: c._count?.businesses || 0,
        })),
      };
    });
  } catch (err) {
    console.error("Error in getCategoriesDirect:", err);
    return [];
  }
}

export async function searchBusinessesDirect(filters: SearchFilters): Promise<PaginatedResult<BusinessSummary>> {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      status: "approved",
    };

    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { address: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    if (filters.city) {
      where.city = { slug: filters.city };
    }

    if (filters.category) {
      where.categories = {
        some: {
          category: {
            OR: [
              { slug: filters.category },
              { parent: { slug: filters.category } },
            ],
          },
        },
      };
    }

    if (filters.subcategory) {
      where.categories = {
        some: {
          category: { slug: filters.subcategory },
        },
      };
    }

    if (filters.verified) {
      where.isVerified = true;
    }

    if (filters.minRating) {
      where.avgRating = { gte: filters.minRating };
    }

    const [items, total] = await Promise.all([
      prisma.business.findMany({
        where,
        take: limit,
        skip,
        include: {
          city: true,
          locality: true,
          categories: { include: { category: true } },
        },
        orderBy: filters.sort === "rating" ? { avgRating: "desc" } : { createdAt: "desc" },
      }),
      prisma.business.count({ where }),
    ]);

    const formattedItems: BusinessSummary[] = items.map((b: any) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      coverImageUrl: resolveImageUrl(b.coverImageUrl),
      planTier: b.planTier,
      isVerified: b.isVerified,
      isTrusted: b.isTrusted,
      avgRating: Number(b.avgRating),
      reviewCount: b.reviewCount,
      priceRange: b.priceRange,
      address: b.address,
      citySlug: b.city?.slug ?? "",
      cityName: b.city?.name ?? "",
      localitySlug: b.locality?.slug ?? null,
      localityName: b.locality?.name ?? null,
      areaSlug: null,
      areaName: null,
      lat: b.lat != null ? Number(b.lat) : null,
      lng: b.lng != null ? Number(b.lng) : null,
      distanceKm: null,
      primaryCategoryName: b.categories[0]?.category?.name ?? null,
      primaryCategorySlug: b.categories[0]?.category?.slug ?? null,
      isOpenNow: true,
      hasActiveOffer: false,
      score: 100,
    }));

    return {
      items: formattedItems,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasVerifiedMatches: total > 0,
    };
  } catch (err) {
    console.error("Error in searchBusinessesDirect:", err);
    return { items: [], page: 1, limit: 20, total: 0, totalPages: 1, hasVerifiedMatches: false };
  }
}
