import { NextResponse } from "next/server";
import { buildSitemapXml, getBusinessChunkSitemapEntries } from "@/app/lib/sitemap-builder";

export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chunkNumber = parseInt(id, 10);

  if (isNaN(chunkNumber) || chunkNumber < 1) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const entries = await getBusinessChunkSitemapEntries(chunkNumber - 1);
    if (entries.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }
    const xml = buildSitemapXml(entries);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error(`Error generating sitemap businesses chunk ${id}:`, err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
