import { createBusinessChunkHandler } from "@/app/lib/sitemap-builder";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const GET = createBusinessChunkHandler(3);
