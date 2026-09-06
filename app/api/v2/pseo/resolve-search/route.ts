import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    if (!q) {
      return NextResponse.json({ success: true, data: { path: null } });
    }

    const trimmed = q.trim();
    const match = trimmed.match(/^(?:top|best)\s+(.+?)\s+in\s+(.+)$/i);
    if (match) {
      const categoryTerm = match[1].trim();
      const locationTerm = match[2].trim();

      const [category, city] = await Promise.all([
        prisma.category.findFirst({
          where: {
            OR: [
              { slug: { contains: categoryTerm, mode: "insensitive" } },
              { name: { contains: categoryTerm, mode: "insensitive" } },
            ],
          },
        }),
        prisma.city.findFirst({
          where: {
            OR: [
              { slug: { contains: locationTerm, mode: "insensitive" } },
              { name: { contains: locationTerm, mode: "insensitive" } },
            ],
          },
        }),
      ]);

      if (category && city) {
        return NextResponse.json({
          success: true,
          data: { path: `/category/${category.slug}/${city.slug}` },
        });
      }

      if (category) {
        return NextResponse.json({
          success: true,
          data: { path: `/category/${category.slug}` },
        });
      }
    }

    return NextResponse.json({ success: true, data: { path: null } });
  } catch {
    return NextResponse.json({ success: true, data: { path: null } });
  }
}
