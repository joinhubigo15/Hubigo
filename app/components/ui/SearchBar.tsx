"use client";

import { useState } from "react";
import { cn } from "@/app/lib/utils";

interface SearchBarProps {
  variant?: "hero" | "navbar";
  className?: string;
}

const categoryOptions = [
  "All Categories",
  "Restaurants",
  "Hospitals",
  "Hotels",
  "Gyms & Fitness",
  "Salons & Spas",
  "Plumbers",
  "Electricians",
  "Shopping",
  "Education",
  "Real Estate",
];

export default function SearchBar({
  variant = "hero",
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [location, setLocation] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "w-full transition-all duration-300",
        isHero ? "max-w-3xl mx-auto" : "max-w-xl",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col sm:flex-row items-stretch bg-white rounded-[var(--radius-xl)] transition-all duration-300",
          isHero
            ? "p-2 shadow-lg border border-border-light"
            : "p-1.5 shadow-md border border-border"
        )}
      >
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 px-4 py-2.5">
          <svg
            className="w-5 h-5 text-secondary-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search for restaurants, services, businesses..."
            className={cn(
              "flex-1 bg-transparent outline-none text-secondary placeholder:text-secondary-400",
              isHero ? "text-base" : "text-sm"
            )}
            id="search-input"
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-border self-stretch my-2" />

        {/* Category Select */}
        {isHero && (
          <>
            <div className="flex items-center gap-2 px-4 py-2.5 border-t sm:border-t-0 border-border-light">
              <svg
                className="w-5 h-5 text-secondary-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent outline-none text-sm text-secondary cursor-pointer appearance-none pr-4 min-w-[120px]"
                id="search-category"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block w-px bg-border self-stretch my-2" />
          </>
        )}

        {/* Location Input */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t sm:border-t-0 border-border-light">
          <svg
            className="w-5 h-5 text-primary flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Location"
            className="flex-1 bg-transparent outline-none text-sm text-secondary placeholder:text-secondary-400 min-w-[90px]"
            id="search-location"
          />
        </div>

        {/* Search Button */}
        <button
          className={cn(
            "flex items-center justify-center gap-2 font-semibold text-white bg-primary hover:bg-primary-dark active:scale-[0.96] transition-all duration-300 cursor-pointer",
            isHero
              ? "px-7 py-3 rounded-[var(--radius-lg)] text-sm m-1"
              : "px-5 py-2 rounded-[var(--radius-md)] text-sm m-0.5"
          )}
          id="search-button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </div>
  );
}
