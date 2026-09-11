import { NextResponse } from "next/server";
import { buildSitemapIndexXml, getSitemapIndexEntries } from "@/app/lib/sitemap-builder";

export const revalidate = 3600;

export async function GET() {
  try {
    const entries = await getSitemapIndexEntries();
    const xml = buildSitemapIndexXml(entries);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("Error generating sitemap index:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
