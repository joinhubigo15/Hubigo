"use client";

import { useIntersectionObserver } from "@/app/hooks/useIntersectionObserver";
import { cn } from "@/app/lib/utils";

export default function DownloadAppCTA() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="section-padding overflow-hidden bg-bg" id="download-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={cn(
            "relative rounded-[var(--radius-2xl)] bg-gradient-to-br from-secondary via-secondary-light to-secondary text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl",
            "transition-all duration-700 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Decorative Glow Backgrounds */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Text & Action */}
            <div className="lg:col-span-7 flex flex-col items-start gap-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-primary-200">
                <span>📱</span> Available on iOS & Android
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Hubigo in Your Pocket.
                <br />
                <span className="gradient-text">Discover Anywhere.</span>
              </h2>
              <p className="text-secondary-300 text-base sm:text-lg max-w-xl leading-relaxed">
                Get real-time location alerts, exclusive mobile-only deals, instant one-tap calling, and offline bookmarking with the Hubigo app.
              </p>

              {/* App Store Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {/* App Store */}
                <a
                  href="#"
                  className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 rounded-[var(--radius-lg)] transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.6.7-1.13 1.84-.99 2.94 1.07.08 2.15-.54 2.8-1.34z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] uppercase text-secondary-300 font-semibold tracking-wider">Download on the</div>
                    <div className="text-sm font-bold leading-none">App Store</div>
                  </div>
                </a>

                {/* Google Play */}
                <a
                  href="#"
                  className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 rounded-[var(--radius-lg)] transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-1.424V3.238c0-.546.22-1.042.61-1.424zM15.206 13.414l2.766 2.766-10.457 6.037 7.691-8.803zm0-2.828L7.515 1.783l10.457 6.037-2.766 2.766zm1.414 1.414l3.856-2.227c.725-.418.725-1.101 0-1.52l-3.856-2.226-2.226 2.986 2.226 2.987z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] uppercase text-secondary-300 font-semibold tracking-wider">Get it on</div>
                    <div className="text-sm font-bold leading-none">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Mockup Preview */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-64 h-[380px] bg-secondary-900 rounded-[36px] border-4 border-white/20 shadow-2xl overflow-hidden p-3 flex flex-col gap-3">
                {/* Phone Notch */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto flex-shrink-0" />

                {/* App Screen Mockup */}
                <div className="bg-white text-secondary rounded-[24px] p-3 flex-1 flex flex-col gap-2 overflow-hidden shadow-inner text-xs">
                  <div className="flex items-center justify-between font-bold text-primary">
                    <span>Hubigo</span>
                    <span className="w-2 h-2 bg-success rounded-full" />
                  </div>
                  <div className="bg-bg p-2 rounded-lg text-[10px] text-secondary-400">
                    🔍 Search Pune...
                  </div>
                  <div className="bg-primary-50 p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-primary text-[11px]">30% OFF Today</div>
                      <div className="text-[9px] text-secondary-500">Spice Garden Restaurant</div>
                    </div>
                    <div className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full">Claim</div>
                  </div>
                  <div className="font-semibold text-[10px] text-secondary-600">Top Near You</div>
                  <div className="bg-bg p-2 rounded-xl flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary-200 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-[10px]">LifeCare Hospital</div>
                      <div className="text-[9px] text-secondary-400">★ 4.6 • 2.5km</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
