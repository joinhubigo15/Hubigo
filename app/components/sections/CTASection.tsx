"use client";

import Link from "next/link";
import Button from "@/app/components/ui/Button";
import { useIntersectionObserver } from "@/app/hooks/useIntersectionObserver";
import { cn } from "@/app/lib/utils";

export default function CTASection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="section-padding bg-white" id="business-cta">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={cn(
            "relative rounded-[var(--radius-2xl)] bg-gradient-to-r from-primary-50 via-white to-accent-50 p-8 sm:p-12 border border-primary-100 shadow-md text-center max-w-4xl mx-auto overflow-hidden",
            "transition-all duration-700 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              For Business Owners
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-4">
              Grow Your Business with Hubigo
            </h2>
            <p className="text-secondary-600 max-w-xl mx-auto text-base sm:text-lg mb-8 leading-relaxed">
              Create your free business listing today, gain high-intent customer leads, and showcase your services to thousands of local buyers.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/add-listing">
                <Button variant="primary" size="lg">
                  List Your Business Free
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  Explore Pricing Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
