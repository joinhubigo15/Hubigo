import { NextResponse } from "next/server";
import {
  buildSitemapXml,
  buildSitemapIndexXml,
  getStaticSitemapEntries,
  getCategorySitemapEntries,
  getPseoSitemapEntries,
  getBusinessChunkSitemapEntries,
  getSitemapIndexEntries,
} from "@/app/lib/sitemap-builder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sitemap: string }> }
) {
  const { sitemap } = await params;

  if (!sitemap.endsWith(".xml")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const xmlHeaders = {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
  };

  try {
    if (sitemap === "sitemap.xml") {
      const entries = await getSitemapIndexEntries();
      const xml = buildSitemapIndexXml(entries);
      return new NextResponse(xml, { headers: xmlHeaders });
    }

    if (sitemap === "sitemap-static.xml") {
      const entries = await getStaticSitemapEntries();
      const xml = buildSitemapXml(entries);
      return new NextResponse(xml, { headers: xmlHeaders });
    }

    if (sitemap === "sitemap-categories.xml") {
      const entries = await getCategorySitemapEntries();
      const xml = buildSitemapXml(entries);
      return new NextResponse(xml, { headers: xmlHeaders });
    }

    if (sitemap === "sitemap-pseo.xml") {
      const entries = await getPseoSitemapEntries();
      const xml = buildSitemapXml(entries);
      return new NextResponse(xml, { headers: xmlHeaders });
    }

    const match = sitemap.match(/^sitemap-businesses-(\d+)\.xml$/);
    if (match) {
      const chunkNumber = parseInt(match[1], 10);
      if (isNaN(chunkNumber) || chunkNumber < 1) {
        return new NextResponse("Not Found", { status: 404 });
      }
      const entries = await getBusinessChunkSitemapEntries(chunkNumber - 1);
      if (entries.length === 0) {
        return new NextResponse("Not Found", { status: 404 });
      }
      const xml = buildSitemapXml(entries);
      return new NextResponse(xml, { headers: xmlHeaders });
    }

    return new NextResponse("Not Found", { status: 404 });
  } catch (err: any) {
    console.error(`Error generating sitemap for ${sitemap}:`, err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
