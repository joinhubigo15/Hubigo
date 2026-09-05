import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "20");

    const where: any = {
      deletedAt: null,
      status: "approved",
    };

    if (city) where.city = { slug: city };
    if (category) where.categories = { some: { category: { slug: category } } };

    const items = await prisma.business.findMany({
      where,
      take: limit,
      include: {
        city: true,
        locality: true,
        categories: { include: { category: true } },
      },
      orderBy: { avgRating: "desc" },
    });

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

    return NextResponse.json({ success: true, data: { items: formattedItems } });
  } catch (error: any) {
    console.error("Error in GET /api/v1/nearby:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch nearby listings" }, { status: 500 });
  }
}
