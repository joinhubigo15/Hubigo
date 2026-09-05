import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
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
      },
    });

    if (!business) {
      return NextResponse.json({ success: false, message: "Business listing not found" }, { status: 404 });
    }

    const primaryBc = business.categories.find((c: any) => c.isPrimary) ?? business.categories[0];
    const category = primaryBc?.category;
    const parentCategory = category?.parent ?? null;
    const subcategory = parentCategory ? category : null;
    const mainCategory = parentCategory ?? category ?? null;

    const data = {
      id: business.id,
      slug: business.slug,
      name: business.name,
      description: business.description,
      planTier: business.planTier,
      isVerified: business.isVerified,
      isTrusted: business.isTrusted,
      avgRating: Number(business.avgRating),
      reviewCount: business.reviewCount,
      googleRating: business.googleRating ? Number(business.googleRating) : null,
      googleReviewCount: business.googleReviewCount ?? 0,
      priceRange: business.priceRange,
      phone: business.phone,
      whatsapp: business.whatsapp,
      email: business.email,
      websiteUrl: business.websiteUrl,
      address: business.address,
      pincode: business.pincode,
      city: business.city ? { id: business.city.id, name: business.city.name, slug: business.city.slug } : null,
      locality: business.locality ? { id: business.locality.id, name: business.locality.name, slug: business.locality.slug } : null,
      lat: business.lat != null ? Number(business.lat) : null,
      lng: business.lng != null ? Number(business.lng) : null,
      coverImageUrl: business.coverImageUrl,
      logoUrl: business.logoUrl,
      mainCategory: mainCategory ? { id: mainCategory.id, name: mainCategory.name, slug: mainCategory.slug } : null,
      subcategory: subcategory ? { id: subcategory.id, name: subcategory.name, slug: subcategory.slug } : null,
      amenities: business.amenities.map((a: any) => ({ id: a.amenity.id, name: a.amenity.name, slug: a.amenity.slug, icon: a.amenity.icon })),
      services: business.services.map((s: any) => ({ id: s.id, name: s.name, description: s.description, price: s.price ? Number(s.price) : null })),
      media: business.media.map((m: any) => ({ id: m.id, type: m.type, url: m.url, caption: m.caption })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in GET /api/v1/businesses/[slug]:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch business" }, { status: 500 });
  }
}
