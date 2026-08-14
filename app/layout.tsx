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
    default: "Hubigo — Discover the Best Local Businesses Near You",
    template: "%s | Hubigo",
  },
  description:
    "Hubigo is India's modern local discovery platform. Find restaurants, hospitals, hotels, salons, plumbers, electricians and more. Read reviews, compare businesses, and connect instantly.",
  keywords: [
    "local businesses",
    "business directory",
    "restaurants near me",
    "best businesses",
    "Hubigo",
    "India business search",
    "local discovery",
    "find services",
  ],
  openGraph: {
    title: "Hubigo — Discover the Best Local Businesses Near You",
    description:
      "India's modern local discovery platform. Find, compare, and connect with businesses near you.",
    type: "website",
    locale: "en_IN",
    siteName: "Hubigo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hubigo — Discover the Best Local Businesses",
    description:
      "India's modern local discovery platform. Find, compare, and connect with businesses near you.",
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
