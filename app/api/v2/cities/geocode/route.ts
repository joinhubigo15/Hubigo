import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        data: { lat: 12.9716, lng: 77.5946, addressName: "Bangalore", citySlug: "bangalore" },
      });
    }

    const locality = await prisma.locality.findFirst({
      where: { name: { contains: q, mode: "insensitive" } },
      include: { city: true },
    });

    if (locality) {
      return NextResponse.json({
        success: true,
        data: {
          lat: locality.lat != null ? Number(locality.lat) : 12.9716,
          lng: locality.lng != null ? Number(locality.lng) : 77.5946,
          addressName: locality.name,
          citySlug: locality.city?.slug ?? "bangalore",
        },
      });
    }

    const city = await prisma.city.findFirst({
      where: { name: { contains: q, mode: "insensitive" } },
    });

    if (city) {
      return NextResponse.json({
        success: true,
        data: {
          lat: city.lat != null ? Number(city.lat) : 12.9716,
          lng: city.lng != null ? Number(city.lng) : 77.5946,
          addressName: city.name,
          citySlug: city.slug,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { lat: 12.9716, lng: 77.5946, addressName: q, citySlug: "bangalore" },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: { lat: 12.9716, lng: 77.5946, addressName: "Bangalore", citySlug: "bangalore" },
    });
  }
}
