import { NextRequest, NextResponse } from "next/server";
import { executeSearch } from "@/app/lib/business-search-engine";
import type { SearchFilters, SortOption, PriceRange, PlanTier } from "@/app/lib/search-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filters: SearchFilters = {
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      subcategory: searchParams.get("subcategory") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      locality: searchParams.get("locality") ?? undefined,
      pincode: searchParams.get("pincode") ?? undefined,
      openNow: searchParams.get("openNow") === "true",
      verified: searchParams.get("verified") === "true",
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      lat: searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined,
      lng: searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined,
      radiusKm: searchParams.get("radiusKm") ? Number(searchParams.get("radiusKm")) : undefined,
      sort: (searchParams.get("sort") as SortOption) || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const priceRaw = searchParams.get("price");
    if (priceRaw) {
      filters.price = priceRaw.split(",").filter(Boolean) as PriceRange[];
    }

    const tierRaw = searchParams.get("tier");
    if (tierRaw) {
      filters.tier = tierRaw.split(",").filter(Boolean) as PlanTier[];
    }

    const result = await executeSearch(filters);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in GET /api/v2/search:", error);
    return NextResponse.json({ success: false, message: error.message || "Search failed" }, { status: 400 });
  }
}
