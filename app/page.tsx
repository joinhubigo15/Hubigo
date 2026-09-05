import DesktopSidebar from "@/app/components/layout/DesktopSidebar";
import DesktopHeader from "@/app/components/layout/DesktopHeader";
import MobileBottomNav from "@/app/components/layout/MobileBottomNav";
import HeroBannerSection from "@/app/components/sections/HeroBannerSection";
import CategoryStrip from "@/app/components/sections/CategoryStrip";
import FeaturedBusinessesSection from "@/app/components/sections/FeaturedBusinessesSection";
import StatsStripBanner, { type PlatformStats } from "@/app/components/sections/StatsStripBanner";
import PopularBusinessesSection from "@/app/components/sections/PopularBusinessesSection";
import NearbyBusinessesSection from "@/app/components/sections/NearbyBusinessesSection";
import ServicesNearYouSection from "@/app/components/sections/ServicesNearYouSection";
import BusinessOwnerCTASection from "@/app/components/sections/BusinessOwnerCTASection";
import DirectoryFooterSection from "@/app/components/sections/DirectoryFooterSection";
import { request } from "@/app/lib/api";
import { searchBusinesses } from "@/app/lib/search-api";
import { FEATURED_COUNT, pickDistinctCategories } from "@/app/lib/featured-businesses";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/app/lib/json-ld";
import JsonLd from "@/app/components/seo/JsonLd";
import type { Metadata } from "next";

// See app/sitemap.ts for why this can't be build-time static: Railway's build sandbox can't
// reach the backend by any path.
export const dynamic = "force-dynamic";

// Title/description are inherited from the root layout's defaults — only the canonical needs
// declaring here.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  // No .catch() — this page never 404s either way, but swallowing a failure here would replace a
  // good cached render (real stats, real featured businesses) with an empty-looking one and cache
  // that for an hour. Letting it propagate means a failed revalidation just keeps serving the last
  // good render instead.
  const [statsResult, featuredResult] = await Promise.all([
    request<PlatformStats>("/api/v2/stats"),
    searchBusinesses({ sort: "rating", limit: 40 }),
  ]);
  const initialStats = statsResult;
  const initialBusinesses = pickDistinctCategories(featuredResult.items, FEATURED_COUNT);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900 flex flex-col">
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildWebSiteJsonLd()} />

      {/* Fixed Left Sidebar (Desktop View) */}
      <DesktopSidebar />

      {/* Main Content Area - Full Scrollable View */}
      <div className="lg:ml-64 flex flex-col min-h-screen justify-between pb-16 lg:pb-0">
        {/* Top Header Controls (Desktop View) */}
        <DesktopHeader />

        {/* Home Page Main Sections */}
        <main className="flex-1 flex flex-col space-y-6 sm:space-y-8 lg:space-y-10 pb-3 sm:pb-4 pt-0">
          {/* Hero Banner (Mobile Dark Header / Desktop Light Hero with 3D Map Pin) */}
          <HeroBannerSection />

          {/* Category Icons Selector Strip */}
          <CategoryStrip />

          {/* Featured Businesses Section */}
          <FeaturedBusinessesSection initialBusinesses={initialBusinesses} />

          {/* Popular Businesses Section (Brand Logos) */}
          <PopularBusinessesSection />

          {/* Nearby Businesses Section (3 Cards, same style as Featured Businesses) */}
          <NearbyBusinessesSection initialBusinesses={featuredResult.items.slice(4, 7)} />

          {/* Services Near You Section (5 Service Icons + 3 Live Cards) */}
          <ServicesNearYouSection initialBusinesses={featuredResult.items.slice(7, 10)} />

          {/* "Are you a business owner?" CTA Banner */}
          <BusinessOwnerCTASection />

          {/* Professional Links & Social Media Footer Section */}
          <DirectoryFooterSection />
        </main>
      </div>

      {/* Fixed Bottom Navigation Bar (Mobile View) */}
      <MobileBottomNav />
    </div>
  );
}
