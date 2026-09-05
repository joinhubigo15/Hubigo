import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      include: {
        localities: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: cities });
  } catch (error: any) {
    console.error("Error in GET /api/v2/cities:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch cities" }, { status: 500 });
  }
}
