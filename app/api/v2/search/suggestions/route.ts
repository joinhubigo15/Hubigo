import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const limit = Number(searchParams.get("limit") ?? "8");

    if (!q.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    const [businesses, categories] = await Promise.all([
      prisma.business.findMany({
        where: {
          status: "approved",
          deletedAt: null,
          name: { contains: q, mode: "insensitive" },
        },
        take: limit,
        select: { id: true, name: true, slug: true, city: { select: { slug: true } } },
      }),
      prisma.category.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
        },
        take: limit,
        select: { id: true, name: true, slug: true },
      }),
    ]);

    const suggestions = [
      ...categories.map((c) => ({
        type: "category" as const,
        label: c.name,
        sublabel: "Category",
        slug: c.slug,
        citySlug: null,
      })),
      ...businesses.map((b) => ({
        type: "business" as const,
        label: b.name,
        sublabel: "Healthcare Business",
        slug: b.slug,
        citySlug: b.city?.slug ?? null,
      })),
    ].slice(0, limit);

    return NextResponse.json({ success: true, data: suggestions });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
