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
  const categories = await getCategories().catch((err) => {
    // TEMP (2026-08-19): silent fallback was masking why this comes back empty — remove once root
    // cause is found and fixed.
    console.error("getCategories() failed on /category:", err);
    return [];
  });

  return <AllCategoriesClient initialCategories={categories} />;
}
