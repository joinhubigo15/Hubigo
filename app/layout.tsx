import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/app/lib/auth-context";
import { CityProvider } from "@/app/lib/city-context";
import { NotFoundProvider } from "@/app/lib/not-found-context";
import GoogleAnalytics from "@/app/components/analytics/GoogleAnalytics";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hubigo Healthcare — Discover Top Hospitals, Doctors & Medical Services Near You",
    template: "%s | Hubigo Healthcare",
  },
  description:
    "Hubigo Healthcare is India's dedicated medical & healthcare discovery platform. Find hospitals, clinics, specialist doctors, diagnostic labs, and 24/7 pharmacies near you.",
  keywords: [
    "healthcare directory",
    "hospitals near me",
    "specialist doctors",
    "diagnostic labs",
    "pharmacies near me",
    "Hubigo Healthcare",
    "India medical search",
    "clinics near me",
  ],
  openGraph: {
    title: "Hubigo Healthcare — Discover Top Hospitals, Doctors & Medical Services",
    description:
      "India's dedicated medical & healthcare discovery platform. Find, compare, and connect with healthcare providers near you.",
    type: "website",
    locale: "en_IN",
    siteName: "Hubigo Healthcare",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hubigo Healthcare — Discover Top Hospitals & Doctors",
    description:
      "India's dedicated medical & healthcare discovery platform. Find, compare, and connect with healthcare providers near you.",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Empty until the property is created in Search Console and the code is added to .env.local —
  // Next omits the tag entirely when this is undefined, so this is inert (not broken markup) until then.
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
        <NotFoundProvider>
          <AuthProvider>
            <CityProvider>{children}</CityProvider>
          </AuthProvider>
        </NotFoundProvider>
      </body>
    </html>
  );
}
