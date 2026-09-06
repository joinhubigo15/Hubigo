import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET() {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: amenities });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
