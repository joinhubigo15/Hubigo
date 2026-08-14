"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Share2, X, ChevronLeft, ChevronRight, Star, MapPin, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { getBusinessBySlug, type BusinessDetail } from "@/app/lib/search-api";

export default function BusinessGalleryPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getBusinessBySlug(slug)
      .then((data) => setBusiness(data))
      .catch(() => setLoadError("We couldn't find that business listing."))
      .finally(() => setLoading(false));
  }, [slug]);

  // Unclaimed businesses only carry stock/enrichment photos from the import pipeline, never real
  // owner-provided ones — same isClaimed gate as the business profile page's gallery section.
  const images = useMemo(
    () => (business?.isClaimed ? (business?.media ?? []).filter((m) => m.type === "image") : []),
    [business],
  );
  const primaryCategory = business?.categories.find((c) => c.isPrimary)?.category ?? business?.categories[0]?.category;
  const selectedItem = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  if (loading) {
    return (
      <div className="bg-slate-50/60 min-h-screen px-4 lg:px-8 py-6 animate-pulse space-y-6">
        <div className="h-16 bg-white rounded-2xl border border-slate-100" />
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !business) {
    return (
      <div className="bg-slate-50/60 min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-black text-slate-900">Listing not found</h1>
          <p className="text-sm text-slate-500">{loadError || "This business listing doesn't exist or has been removed."}</p>
          <Link href="/search" className="inline-block text-sm font-bold text-purple-600 hover:underline">
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen px-4 lg:px-8 py-6 flex flex-col gap-6">

      {/* Header Back & Action Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
        <Link
          href={`/business/${business.slug}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Business Profile</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: business.name, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
              }
            }}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-purple-600 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gallery Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#130d2a] to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/30">
              Media Gallery
            </span>
            <span className="text-[10px] font-bold text-slate-300">{images.length} Total Photos</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
            {business.name} Gallery
          </h1>
          <p className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              {business.locality ? `${business.locality.name}, ` : ""}
              {business.city.name}
              {primaryCategory ? ` • ${primaryCategory.name}` : ""}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-xl p-3 text-center min-w-[90px]">
            <div className="text-lg font-black text-white">{business.avgRating.toFixed(1)}★</div>
          </div>
        </div>
      </div>

      {/* Media Grid Gallery */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setSelectedImageIndex(idx)}
              className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer relative"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={item.url}
                  alt={business.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-2">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No photos uploaded yet</p>
          <p className="text-xs text-slate-500">Check back later or claim this listing to add photos.</p>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <h3 className="font-bold text-sm text-white">{business.name}</h3>
              <button
                onClick={() => setSelectedImageIndex(null)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-[450px] w-full bg-black flex items-center justify-center">
              <img src={selectedItem.url} alt={business.name} className="max-h-full max-w-full object-contain" />

              {selectedImageIndex !== null && selectedImageIndex > 0 && (
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                  className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-purple-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {selectedImageIndex !== null && selectedImageIndex < images.length - 1 && (
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                  className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-purple-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
