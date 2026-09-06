import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { resolveImageUrl } from "@/app/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const city = searchParams.get("city") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "4");

    const where: any = { status: "approved", deletedAt: null };
    if (city) where.city = { slug: city };
    if (category) where.categories = { some: { category: { slug: category } } };

    const items = await prisma.business.findMany({
      where,
      take: limit,
      include: { city: true, locality: true, categories: { include: { category: true } } },
      orderBy: { avgRating: "desc" },
    });

    const formatted = items.map((b: any) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      coverImageUrl: resolveImageUrl(b.coverImageUrl),
      avgRating: Number(b.avgRating),
      reviewCount: b.reviewCount,
      address: b.address,
      cityName: b.city?.name ?? "Bangalore",
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
