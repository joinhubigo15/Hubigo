import { NextRequest, NextResponse } from "next/server";
import { executeSearch } from "@/app/lib/business-search-engine";
import type { SearchFilters, SortOption } from "@/app/lib/search-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("search") || searchParams.get("q") || undefined;
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory") || undefined;
    const city = searchParams.get("city") || undefined;
    const locality = searchParams.get("locality") || undefined;
    const verified = searchParams.get("verified") === "true";
    const openNow = searchParams.get("openNow") === "true";
    const minRating = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined;
    const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined;
    const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined;
    const sort = (searchParams.get("sort") as SortOption) || (lat != null && lng != null ? "distance" : "rating");
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 30;

    const filters: SearchFilters = {
      q,
      category: category && category !== "all" ? category : undefined,
      subcategory,
      city,
      locality,
      verified,
      openNow,
      minRating,
      lat,
      lng,
      sort,
      limit,
    };

    const result = await executeSearch(filters);

    return NextResponse.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/v2/nearby:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch nearby listings" },
      { status: 500 }
    );
  }
}

