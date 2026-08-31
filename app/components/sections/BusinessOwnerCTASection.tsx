"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function BusinessOwnerCTASection() {
  return (
    <section className="px-2 sm:px-4 lg:px-6 mt-5 sm:mt-8 mb-2 shrink-0 max-w-6xl mx-auto">
      <div className="relative bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-purple-100/40 border border-purple-100/80 rounded-2xl p-3.5 sm:p-5 lg:p-6 overflow-hidden flex items-center justify-between gap-3 shadow-2xs">
        
        {/* Left Text Content */}
        <div className="min-w-0 z-10 max-w-md">
          <h2 className="font-black text-slate-900 text-sm sm:text-lg lg:text-xl leading-tight tracking-tight">
            Are you a Healthcare Provider or Doctor?
          </h2>

          <p className="text-slate-600 font-semibold text-[10px] sm:text-xs leading-relaxed mt-0.5 mb-2.5">
            List your hospital, clinic, or medical practice on Hubigo Healthcare and connect with patients.
          </p>

          <Link
            href="/business/register"
            className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-[10px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <span>Register Practice / Facility</span>
            <ArrowRight className="w-3 h-3 stroke-[2.5]" />
          </Link>
        </div>

          {/* Right Sleek Architectural Storefront & 3D Pin Vector Illustration */}
          <div className="relative shrink-0 w-36 h-28 sm:w-52 sm:h-36 lg:w-64 lg:h-40 flex items-center justify-end">
            <svg
              viewBox="0 0 240 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-contain"
            >
              {/* Soft Ground Shadow */}
              <ellipse cx="135" cy="138" rx="85" ry="7" fill="#E9D5FF" opacity="0.7" />

              {/* Architectural Store Building */}
              {/* Main Store Body */}
              <rect x="75" y="50" width="125" height="85" rx="8" fill="#FFFFFF" />
              <rect x="75" y="50" width="125" height="85" rx="8" stroke="#E9D5FF" strokeWidth="2" />

              {/* Store Fascia Signboard Banner */}
              <rect x="70" y="40" width="135" height="22" rx="4" fill="url(#signGradient)" />
              <text x="137" y="55" fill="#FFFFFF" fontSize="9" fontStyle="italic" fontWeight="900" textAnchor="middle" letterSpacing="1">
                HUBIGO STORE
              </text>
              <circle cx="195" cy="51" r="2.5" fill="#34D399" />

              {/* Modern Glass Store Front Display Windows */}
              <rect x="85" y="74" width="45" height="48" rx="4" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1.5" />
              <path d="M85 98 H130" stroke="#EDE9FE" strokeWidth="1.5" />
              <path d="M107.5 74 V122" stroke="#EDE9FE" strokeWidth="1.5" />
              {/* Glass Reflection Accent */}
              <path d="M90 78 L105 78 L95 115 L88 115 Z" fill="#FFFFFF" opacity="0.6" />

              {/* Modern Glass Double Entrance Door */}
              <rect x="145" y="74" width="42" height="61" rx="4" fill="#6B21A8" stroke="#581C87" strokeWidth="1.5" />
              <rect x="149" y="78" width="16" height="34" rx="2" fill="#F5F3FF" opacity="0.9" />
              <rect x="167" y="78" width="16" height="34" rx="2" fill="#F5F3FF" opacity="0.9" />
              {/* Door Handles */}
              <rect x="163" y="94" width="2" height="8" rx="1" fill="#FFFFFF" />
              <rect x="167" y="94" width="2" height="8" rx="1" fill="#FFFFFF" />

              {/* Sleek Striped Canopy Awning over Entrance */}
              <path d="M65 40 L210 40 L205 28 L70 28 Z" fill="#7E22CE" />
              {/* Awning Metallic Edging */}
              <rect x="65" y="38" width="145" height="3" fill="#A855F7" />

              {/* 3D Purple Location Pin Standing Beside Store */}
              <g transform="translate(35, 30)">
                <ellipse cx="20" cy="90" rx="12" ry="3.5" fill="#6B21A8" opacity="0.25" />
                <path
                  d="M20 5 C9.5 5 1 13.5 1 24 C1 37.5 20 66 20 66 C20 66 39 37.5 39 24 C39 13.5 30.5 5 20 5 Z"
                  fill="url(#pinGrad)"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
                <circle cx="20" cy="24" r="7" fill="#FFFFFF" />
              </g>

              {/* SVG Gradients */}
              <defs>
                <linearGradient id="signGradient" x1="70" y1="40" x2="205" y2="62" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7E22CE" />
                  <stop offset="1" stopColor="#4C1D95" />
                </linearGradient>
                <linearGradient id="pinGrad" x1="1" y1="5" x2="39" y2="66" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A855F7" />
                  <stop offset="1" stopColor="#6B21A8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

      </div>
    </section>
  );
}
