import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET() {
  try {
    const [totalBusinesses, totalCategories, totalCities, totalPincodeAreas] = await Promise.all([
      prisma.business.count({ where: { status: "approved", deletedAt: null } }),
      prisma.category.count(),
      prisma.city.count(),
      prisma.pincodeArea.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalBusinesses,
        totalCategories,
        totalCities,
        totalPincodeAreas,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/v1/stats:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch stats" }, { status: 500 });
  }
}
