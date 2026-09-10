import { NextResponse, type NextRequest } from "next/server";
import { buildSitemapXml, getBusinessChunkSitemapEntries } from "@/app/lib/sitemap-builder";

export const revalidate = 86400;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chunkNum = parseInt(id.replace(/\.xml$/, ""), 10);
    if (isNaN(chunkNum) || chunkNum < 1) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const entries = await getBusinessChunkSitemapEntries(chunkNum - 1);
    const xml = buildSitemapXml(entries);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("Error generating business sitemap chunk:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
