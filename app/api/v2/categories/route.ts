import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Error in GET /api/v2/categories:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch categories" }, { status: 500 });
  }
}
