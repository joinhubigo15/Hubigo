import type { Metadata } from "next";
import { getCategories } from "@/app/lib/search-api";
import AllCategoriesClient from "./AllCategoriesClient";

export const revalidate = 3600;

const title = "All Categories";
const description = "Browse every business category listed on Hubigo, India's local discovery platform.";

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
