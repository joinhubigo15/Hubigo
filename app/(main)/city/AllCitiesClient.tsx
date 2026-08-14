"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, Building2, Globe } from "lucide-react";
import { type CityOption } from "@/app/lib/search-api";

// Served from the R2 "business" bucket's city-images/ prefix (see backend/scripts/upload-city-images-r2.ts).
const R2_BASE = process.env.NEXT_PUBLIC_R2_BUSINESS_BUCKET_URL ?? "";

const CITY_BG_IMAGES: Record<string, string> = {
  bangalore: `${R2_BASE}/city-images/bg1.jpg`,
  chennai: `${R2_BASE}/city-images/bg2.jpg`,
  hyderabad: `${R2_BASE}/city-images/bg3.jpg`,
};

export default function AllCitiesPage({ initialCities }: { initialCities: CityOption[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cities] = useState<CityOption[]>(initialCities);

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const stateWiseCities = Object.values(
    cities.reduce<Record<string, { state: string; cities: string[] }>>((acc, c) => {
      (acc[c.state] ??= { state: c.state, cities: [] }).cities.push(c.name);
      return acc;
    }, {}),
  );

  return (
    <div className="bg-slate-50/60 min-h-screen px-4 lg:px-0 py-6 lg:py-0 flex flex-col gap-6 lg:gap-0">
      
      {/* City Directory Header */}
      <div className="bg-white rounded-2xl lg:rounded-none border border-slate-100 lg:border-b lg:border-x-0 lg:border-t-0 p-6 sm:p-8 lg:p-8 lg:px-12 shadow-xs lg:shadow-none relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
            <Globe className="w-3.5 h-3.5" />
            <span>Pan-India Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
            All Cities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed font-semibold">
            Discover 800,000+ verified businesses across 500+ areas and major Indian cities.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-80 relative z-10">
          <Search className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search city (e.g. Bangalore, Chennai)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white"
          />
        </div>
      </div>

      {/* City Directory Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-0 max-w-6xl lg:max-w-none mx-auto w-full shrink-0">
        <div className="bg-white border lg:border-b lg:border-r lg:border-t-0 lg:border-l-0 border-slate-100 rounded-xl lg:rounded-none p-3 text-center shadow-2xs lg:shadow-none">
          <div className="text-sm sm:text-base font-black text-purple-600">800,000+</div>
          <div className="text-[9px] sm:text-xs font-semibold text-slate-500 mt-0.5">Active Listings</div>
        </div>
        <div className="bg-white border lg:border-b lg:border-r lg:border-t-0 lg:border-l-0 border-slate-100 rounded-xl lg:rounded-none p-3 text-center shadow-2xs lg:shadow-none">
          <div className="text-sm sm:text-base font-black text-purple-600">500+</div>
          <div className="text-[9px] sm:text-xs font-semibold text-slate-500 mt-0.5">Areas Covered</div>
        </div>
        <div className="bg-white border lg:border-b lg:border-r lg:border-t-0 lg:border-l-0 border-slate-100 rounded-xl lg:rounded-none p-3 text-center shadow-2xs lg:shadow-none">
          <div className="text-sm sm:text-base font-black text-purple-600">50+</div>
          <div className="text-[9px] sm:text-xs font-semibold text-slate-500 mt-0.5">Supported Cities</div>
        </div>
        <div className="bg-white border lg:border-b lg:border-x-0 lg:border-t-0 border-slate-100 rounded-xl lg:rounded-none p-3 text-center shadow-2xs lg:shadow-none">
          <div className="text-sm sm:text-base font-black text-purple-600">100%</div>
          <div className="text-[9px] sm:text-xs font-semibold text-slate-500 mt-0.5">Verified Merchants</div>
        </div>
      </div>

      {/* Popular Cities Grid */}
      <div className="space-y-4 lg:space-y-6 lg:bg-white lg:p-12 lg:py-8 lg:border-b lg:border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Popular Cities ({filteredCities.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredCities.map((city) => (
            <Link
              key={city.id}
              href={`/city/${city.slug}`}
              className="group bg-white rounded-2xl lg:rounded-none border border-slate-100 lg:border-slate-200/90 overflow-hidden shadow-2xs lg:shadow-none hover:shadow-md lg:hover:shadow-none transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* Banner */}
              <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 flex items-center justify-center">
                <Image
                  src={CITY_BG_IMAGES[city.slug] || `${R2_BASE}/city-images/${city.slug}.jpg`}
                  alt={`${city.name} skyline`}
                  fill
                  sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white flex items-center gap-1.5 z-10">
                  <MapPin className="w-4 h-4 text-purple-300" />
                  <span className="font-extrabold text-sm tracking-tight">{city.name}</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Active Listings</span>
                </div>
                <span className="text-xs font-black text-purple-600">
                  {city.businessCount.toLocaleString("en-IN")}+
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* State-Wise Grouping Directory */}
      <div className="bg-white rounded-2xl lg:rounded-none border border-slate-100 lg:border-0 p-6 lg:p-12 lg:py-8 shadow-xs lg:shadow-none space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          State-Wise City Directory
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stateWiseCities.map((item) => (
            <div key={item.state} className="space-y-2 border-b border-slate-100 pb-3 md:border-none md:pb-0">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>{item.state}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.cities.map((cityName) => (
                  <Link
                    key={cityName}
                    href={`/city/${cityName.toLowerCase()}`}
                    className="text-xs font-semibold text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors"
                  >
                    {cityName}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
