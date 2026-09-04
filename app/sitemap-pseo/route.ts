import { NextResponse } from "next/server";
import { buildSitemapXml, getPseoSitemapEntries } from "@/app/lib/sitemap-builder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const entries = await getPseoSitemapEntries();
    const xml = buildSitemapXml(entries);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("Error generating sitemap pseo:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
