import type { Metadata } from "next";
import { getCities } from "@/app/lib/search-api";
import AllCitiesClient from "./AllCitiesClient";

export const revalidate = 3600;

const title = "All Cities";
const description = "Browse Hubigo's local business directory by city across India.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/city" },
  openGraph: { title, description, url: "/city", type: "website" },
  twitter: { card: "summary", title, description },
};

export default async function AllCitiesPage() {
  // No .catch() — the city list should never legitimately be empty, so a failed fetch must
  // propagate rather than being cached as an empty list for the next hour.
  const cities = await getCities();

  return <AllCitiesClient initialCities={cities} />;
}
