"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, MapPin, Phone, Globe, X, ShieldCheck, Crown, Tag } from "lucide-react";
import BusinessPicker from "@/app/components/search/BusinessPicker";
import { compareBusinesses, type CompareBusiness } from "@/app/lib/search-api";
import { ApiClientError } from "@/app/lib/auth-context";

const PRICE_LABEL: Record<string, string> = {
  budget: "₹",
  moderate: "₹₹",
  premium: "₹₹₹",
  luxury: "₹₹₹₹",
};

function PlanBadge({ tier }: { tier: string }) {
  if (tier === "basic") return <span className="text-xs font-semibold text-slate-500">Basic</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${
        tier === "elite" ? "bg-amber-500" : "bg-purple-600"
      }`}
    >
      <Crown className="w-3 h-3" />
      {tier === "elite" ? "Elite" : "Premium"}
    </span>
  );
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slugs = (searchParams.get("slugs") ?? "").split(",").filter(Boolean);

  const [businesses, setBusinesses] = useState<CompareBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Deferred to a microtask so these state updates happen outside the effect's synchronous pass.
    queueMicrotask(() => {
      if (slugs.length < 2) {
        setBusinesses([]);
        return;
      }
      setLoading(true);
      setErrorMsg(null);
      compareBusinesses(slugs)
        .then(setBusinesses)
        .catch((err) => {
          setErrorMsg(err instanceof ApiClientError ? err.message : "Could not load comparison");
        })
        .finally(() => setLoading(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs.join(",")]);

  function addSlug(slug: string) {
    if (slugs.includes(slug) || slugs.length >= 3) return;
    router.push(`/compare?slugs=${[...slugs, slug].join(",")}`);
  }

  function removeSlug(slug: string) {
    const remaining = slugs.filter((s) => s !== slug);
    router.push(remaining.length > 0 ? `/compare?slugs=${remaining.join(",")}` : "/compare");
  }

  return (
    <div className="bg-[#f1f4f9] min-h-screen px-4 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="text-center">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-widest mb-2 block">
            Side by Side Analysis
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Compare Businesses</h1>
          <p className="text-slate-500 max-w-lg mx-auto text-sm">
            Compare ratings, amenities, pricing, and contact options side-by-side. Add up to 3 businesses.
          </p>
        </div>

        {/* Picker chips + add slot */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {slugs.map((slug) => {
            const b = businesses.find((x) => x.slug === slug);
            return (
              <div
                key={slug}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <span className="truncate max-w-[140px]">{b?.name ?? slug}</span>
                <button onClick={() => removeSlug(slug)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {slugs.length < 3 && (
            <div className="flex-1 min-w-[200px]">
              <BusinessPicker onPick={addSlug} />
            </div>
          )}
        </div>

        {slugs.length < 2 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-10 text-center text-sm text-slate-500">
            Add at least 2 businesses above to see a side-by-side comparison — e.g. search &quot;KFC&quot; then &quot;McDonald&apos;s&quot;.
          </div>
        )}

        {errorMsg && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-xs p-6 text-center text-sm text-rose-600 font-semibold">
            {errorMsg}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-10 text-center text-sm text-slate-400">
            Loading comparison...
          </div>
        )}

        {!loading && businesses.length >= 2 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-5 text-xs font-bold text-slate-500 w-1/4">Feature</th>
                  {businesses.map((b) => (
                    <th key={b.id} className="p-5 text-center">
                      <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden mb-2.5 bg-slate-100">
                        {b.coverImageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.coverImageUrl} alt={b.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <Link href={`/business/${b.slug}`} className="text-sm font-bold text-slate-900 hover:text-purple-600 leading-tight block">
                        {b.name}
                      </Link>
                      <p className="text-xs text-slate-400 font-normal mt-0.5">{b.primaryCategory}</p>
                      <div className="mt-2 flex justify-center">
                        <PlanBadge tier={b.planTier} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                <tr>
                  <td className="p-5 font-bold text-slate-900">Ratings & Reviews</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="p-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-0.5">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-sm font-bold">{b.avgRating.toFixed(1)}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Verification</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="p-5 text-center">
                      {b.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Standard</span>
                      )}
                      {b.isTrusted && <div className="text-[11px] font-semibold text-amber-600 mt-0.5">Trusted</div>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Price Range</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="p-5 text-center font-bold text-slate-800">
                      {b.priceRange ? PRICE_LABEL[b.priceRange] : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Amenities</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="p-5 text-center text-xs">
                      {b.amenities.length > 0 ? b.amenities.join(", ") : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Hours</td>
                  {businesses.map((b) => {
                    const today = b.hours[0];
                    return (
                      <td key={b.id} className="p-5 text-center text-xs">
                        {today && !today.isClosed && today.openTime
                          ? `${today.openTime} – ${today.closeTime}`
                          : "See profile"}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Photos</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="p-5">
                      <div className="flex justify-center gap-1">
                        {b.photos.slice(0, 3).map((url) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={url} src={url} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        ))}
                        {b.photos.length === 0 && <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Offers</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="p-5 text-center">
                      {b.hasActiveOffer ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Tag className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Location & Distance</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="p-5 text-center text-xs">
                      <div className="flex items-center justify-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {[b.locality, b.city].filter(Boolean).join(", ")}
                      </div>
                      {b.distanceKm != null && (
                        <div className="text-slate-400 mt-0.5">{b.distanceKm} km away</div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Contact & Website</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="p-5 text-center text-xs">
                      {b.phone && (
                        <div className="flex items-center justify-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" /> {b.phone}
                        </div>
                      )}
                      {b.website && (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1 text-purple-600 hover:underline mt-1"
                        >
                          <Globe className="w-3 h-3" /> Website
                        </a>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 font-bold text-slate-900">Action</td>
                  {businesses.map((b) => (
                    <td key={b.id} className="p-5 text-center">
                      <Link
                        href={`/business/${b.slug}`}
                        className="inline-block w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        View Details
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f4f9]" />}>
      <ComparePageContent />
    </Suspense>
  );
}
