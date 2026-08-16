"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Loads gtag.js during browser idle time (never blocks/affects the server-rendered HTML, and
 * doesn't compete with the initial page's own JS for main-thread time — PageSpeed flagged this
 * script's ~70KB as almost entirely unused during the initial-load trace, so there's no cost to
 * pushing it later) and fires one GA4 page_view per route: the initial load is handled by gtag's
 * own default config behavior, and this component only fires the event manually on subsequent
 * client-side (App Router) navigations, which gtag.js has no visibility into on its own. */
export default function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!measurementId) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.gtag?.("event", "page_view", { page_path: pathname });
  }, [pathname, measurementId]);

  if (!measurementId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="lazyOnload" />
      <Script id="ga4-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
