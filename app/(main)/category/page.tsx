import type { Metadata } from "next";
import { getCategories } from "@/app/lib/search-api";
import AllCategoriesClient from "./AllCategoriesClient";

// See app/sitemap.ts for why this can't be build-time static: Railway's build sandbox can't
// reach the backend by any path.
export const dynamic = "force-dynamic";

const title = "Healthcare Categories & Medical Specialties";
const description = "Browse all healthcare categories, medical specialties, hospitals, clinics, and diagnostic labs on Hubigo Healthcare.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/category" },
  openGraph: { title, description, url: "/category", type: "website" },
  twitter: { card: "summary", title, description },
};

export default async function AllCategoriesPage() {
  // Deliberately no .catch() here — the category list should never legitimately be empty, so a
  // failed fetch must propagate and fail this revalidation rather than getting cached as an empty
  // list for the next hour (see lib/api.ts's isNotFoundError for the fuller reasoning; this page
  // isn't slug-based so there's no "genuinely not found" case to distinguish, only real failures).
  const categories = await getCategories();

  return <AllCategoriesClient initialCategories={categories} />;
}
