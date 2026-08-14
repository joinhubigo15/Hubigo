"use client";

import { useEffect } from "react";
import { useNotFoundFlag } from "@/app/lib/not-found-context";

/** Renders nothing — just flips the shared "we're on a 404" flag so ancestor layouts (sidebar,
 * header, bottom nav) can hide their chrome while the not-found page is showing, then flips it
 * back off on unmount (i.e. as soon as the user navigates to a real page). */
export default function NotFoundFlag() {
  const { setNotFound } = useNotFoundFlag();

  useEffect(() => {
    setNotFound(true);
    return () => setNotFound(false);
  }, [setNotFound]);

  return null;
}
