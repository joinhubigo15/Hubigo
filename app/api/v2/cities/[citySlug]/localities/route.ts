import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ citySlug: string }> }) {
  try {
    const { citySlug } = await params;
    const localities = await prisma.locality.findMany({
      where: { city: { slug: citySlug } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: localities });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
