import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const city = searchParams.get("city") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      status: "approved",
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ];
    }

    if (city) {
      where.city = { slug: city };
    }

    if (category) {
      where.categories = {
        some: {
          category: { slug: category },
        },
      };
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
        orderBy: { avgRating: "desc" },
      }),
      prisma.business.count({ where }),
    ]);

    const formattedItems = items.map((b: any) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      coverImageUrl: b.coverImageUrl,
      planTier: b.planTier,
      isVerified: b.isVerified,
      isTrusted: b.isTrusted,
      avgRating: Number(b.avgRating),
      reviewCount: b.reviewCount,
      address: b.address,
      citySlug: b.city?.slug ?? "",
      cityName: b.city?.name ?? "",
      localitySlug: b.locality?.slug ?? null,
      localityName: b.locality?.name ?? null,
      lat: b.lat != null ? Number(b.lat) : null,
      lng: b.lng != null ? Number(b.lng) : null,
      primaryCategoryName: b.categories[0]?.category?.name ?? null,
      primaryCategorySlug: b.categories[0]?.category?.slug ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: formattedItems,
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/v1/search:", error);
    return NextResponse.json({ success: false, message: error.message || "Search failed" }, { status: 400 });
  }
}
