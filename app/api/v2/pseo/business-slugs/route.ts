import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET() {
  try {
    const items = await prisma.business.findMany({
      where: { status: "approved", deletedAt: null },
      select: { slug: true, updatedAt: true },
      take: 5000,
    });
    return NextResponse.json({
      success: true,
      data: items.map((i) => ({ slug: i.slug, lastmod: i.updatedAt.toISOString() })),
    });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
